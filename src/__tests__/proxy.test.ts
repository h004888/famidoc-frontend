// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from '../proxy';
import { COOKIE_KEYS } from '@/lib/auth-storage';

function makeRequest(
  url: string,
  cookies: Record<string, string> = {},
  options: { host?: string; proto?: string } = {},
) {
  const host = options.host || 'localhost:3000';
  const proto = options.proto || (host.includes('localhost') ? 'http' : 'https');
  const headers = new Headers();
  headers.set('host', host);
  headers.set('x-forwarded-host', host);
  headers.set('x-forwarded-proto', proto);

  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  if (cookieHeader) headers.set('cookie', cookieHeader);

  return new NextRequest(new URL(url, `${proto}://${host}`), { headers });
}

function loginRedirectTarget(response: Response): string | null {
  const location = response.headers.get('location');
  if (!location) return null;
  return new URL(location, 'http://localhost:3000').searchParams.get('redirect');
}

describe('proxy - giữ URL đích khi chuyển sang đăng nhập', () => {
  it('giữ cả query string của deep link', () => {
    const response = proxy(
      makeRequest('/family/subscription/tracking?contractId=abc'),
    );

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/login');
    expect(loginRedirectTarget(response)).toBe(
      '/family/subscription/tracking?contractId=abc',
    );
  });

  it('giữ đường dẫn khi không có query string', () => {
    const response = proxy(makeRequest('/family/members'));

    expect(response.status).toBe(307);
    expect(loginRedirectTarget(response)).toBe('/family/members');
  });

  it('áp dụng cho phân hệ bác sĩ, cơ sở y tế và admin trên IP thuần (127.0.0.1:3000) sang cổng login nội bộ', () => {
    const doctorRes = proxy(
      makeRequest('/doctor/contracts/abc/review', {}, { host: '127.0.0.1:3000', proto: 'http' }),
    );
    expect(doctorRes.status).toBe(307);
    expect(new URL(doctorRes.headers.get('location')!).pathname).toBe('/doctor/login');
    expect(loginRedirectTarget(doctorRes)).toBe('/doctor/contracts/abc/review');

    const facilityRes = proxy(
      makeRequest('/facility/coordination?tab=inbox', {}, { host: '127.0.0.1:3000', proto: 'http' }),
    );
    expect(facilityRes.status).toBe(307);
    expect(new URL(facilityRes.headers.get('location')!).pathname).toBe('/facility/login');
    expect(loginRedirectTarget(facilityRes)).toBe('/facility/coordination?tab=inbox');

    const adminRes = proxy(
      makeRequest('/admin/users', {}, { host: '127.0.0.1:3000', proto: 'http' }),
    );
    expect(adminRes.status).toBe(307);
    expect(new URL(adminRes.headers.get('location')!).pathname).toBe('/admin/login');
    expect(loginRedirectTarget(adminRes)).toBe('/admin/users');
  });

  it('chuyển hướng /admin*, /facility*, /doctor* trên localhost:3000 sang subdomain *.localhost:3000', () => {
    const adminLoginRes = proxy(makeRequest('/admin/login'));
    expect(adminLoginRes.status).toBe(307);
    expect(adminLoginRes.headers.get('location')).toBe('http://admin.localhost:3000/login');

    const adminUsersRes = proxy(makeRequest('/admin/users?page=2'));
    expect(adminUsersRes.status).toBe(307);
    expect(adminUsersRes.headers.get('location')).toBe(
      'http://admin.localhost:3000/admin/users?page=2',
    );

    const facilityRes = proxy(makeRequest('/facility/coordination?tab=inbox'));
    expect(facilityRes.status).toBe(307);
    expect(facilityRes.headers.get('location')).toBe(
      'http://csyt.localhost:3000/facility/coordination?tab=inbox',
    );

    const doctorRes = proxy(makeRequest('/doctor/contracts'));
    expect(doctorRes.status).toBe(307);
    expect(doctorRes.headers.get('location')).toBe('http://bacsi.localhost:3000/doctor/contracts');

    const doctorRegRes = proxy(makeRequest('/doctor/register'));
    expect(doctorRegRes.status).toBe(307);
    expect(doctorRegRes.headers.get('location')).toBe('http://bacsi.localhost:3000/register');
  });

  it('giữ nguyên ngữ cảnh đặt gói khi chưa đăng nhập mở /booking', () => {
    const response = proxy(
      makeRequest('/booking?packageId=p1&doctorId=d1&facilityId=f1&members=3'),
    );

    expect(response.status).toBe(307);
    expect(loginRedirectTarget(response)).toBe(
      '/booking?packageId=p1&doctorId=d1&facilityId=f1&members=3',
    );
  });

  it('giữ nguyên contractId khi chưa đăng nhập mở /booking/tracking', () => {
    const response = proxy(makeRequest('/booking/tracking?contractId=ctr-1'));

    expect(response.status).toBe(307);
    expect(loginRedirectTarget(response)).toBe('/booking/tracking?contractId=ctr-1');
  });

  it('bảo vệ /settings và /notifications khi chưa đăng nhập', () => {
    const settingsRes = proxy(makeRequest('/settings'));
    expect(settingsRes.status).toBe(307);
    expect(new URL(settingsRes.headers.get('location')!).pathname).toBe('/login');
    expect(loginRedirectTarget(settingsRes)).toBe('/settings');

    const notifRes = proxy(makeRequest('/notifications'));
    expect(notifRes.status).toBe(307);
    expect(new URL(notifRes.headers.get('location')!).pathname).toBe('/login');
    expect(loginRedirectTarget(notifRes)).toBe('/notifications');
  });
});

describe('proxy - bảo vệ luồng /booking theo vai trò hộ gia đình', () => {
  it.each(['FAMILY', 'FAMILY_REP', 'PATIENT'])(
    'cho phép vai trò %s vào /booking',
    (role) => {
      const response = proxy(
        makeRequest('/booking?packageId=p1&doctorId=d1&facilityId=f1&members=2', {
          famidoc_token: 'jwt',
          famidoc_role: role,
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    },
  );

  it.each([
    ['DOCTOR', '/doctor'],
    ['FACILITY', '/facility'],
    ['ADMIN', '/admin'],
  ])('đẩy vai trò %s về trang mặc định khi vào /booking trên IP thuần (127.0.0.1:3000)', (role, homePath) => {
    const response = proxy(
      makeRequest(
        '/booking/tracking?contractId=ctr-1',
        {
          famidoc_token: 'jwt',
          famidoc_role: role,
        },
        { host: '127.0.0.1:3000', proto: 'http' },
      ),
    );

    expect(response.status).toBe(307);
    expect(
      new URL(response.headers.get('location')!, 'http://127.0.0.1:3000').pathname,
    ).toBe(homePath);
  });

  it.each(['DOCTOR', 'FACILITY', 'ADMIN'])(
    'vô hiệu hóa phiên %s và xóa cookie khi vào /booking trên localhost:3000 hoặc famidoc.online',
    (role) => {
      const response = proxy(
        makeRequest(
          '/booking/tracking?contractId=ctr-1',
          {
            famidoc_token: 'jwt',
            famidoc_role: role,
            famidoc_user: encodeURIComponent(JSON.stringify({ id: '1', name: 'Staff' })),
          },
          { host: 'localhost:3000', proto: 'http' },
        ),
      );

      expect(response.status).toBe(307);
      expect(new URL(response.headers.get('location')!).pathname).toBe('/login');
      const setCookie = response.headers.get('set-cookie') || '';
      expect(setCookie).toContain(`${COOKIE_KEYS.ROLE}=`);
      expect(setCookie).toContain(`${COOKIE_KEYS.TOKEN}=`);
      expect(setCookie).toContain(`${COOKIE_KEYS.USER}=`);
    },
  );
});

describe('proxy - định tuyến và cô lập 3 subdomain', () => {
  it('rewrite /login trên admin.famidoc.online, csyt.famidoc.online, bacsi.famidoc.online và admin.localhost', () => {
    const adminRewrite = proxy(
      makeRequest('/login', {}, { host: 'admin.famidoc.online', proto: 'https' }),
    );
    expect(adminRewrite.headers.get('x-middleware-rewrite')).toContain('/admin/login');

    const csytRewrite = proxy(
      makeRequest('/login', {}, { host: 'csyt.famidoc.online', proto: 'https' }),
    );
    expect(csytRewrite.headers.get('x-middleware-rewrite')).toContain('/facility/login');

    const doctorRewrite = proxy(
      makeRequest('/login', {}, { host: 'bacsi.famidoc.online', proto: 'https' }),
    );
    expect(doctorRewrite.headers.get('x-middleware-rewrite')).toContain('/doctor/login');

    const localAdminRewrite = proxy(
      makeRequest('/login', {}, { host: 'admin.localhost:3000', proto: 'http' }),
    );
    expect(localAdminRewrite.headers.get('x-middleware-rewrite')).toContain('/admin/login');
  });

  it('rewrite /register cho bacsi, chuyển /register về /login trên admin và csyt subdomain', () => {
    const csytReg = proxy(
      makeRequest('/register', {}, { host: 'csyt.famidoc.online', proto: 'https' }),
    );
    expect(csytReg.status).toBe(307);
    expect(csytReg.headers.get('location')).toBe('https://csyt.famidoc.online/login');

    const doctorReg = proxy(
      makeRequest('/register', {}, { host: 'bacsi.famidoc.online', proto: 'https' }),
    );
    expect(doctorReg.headers.get('x-middleware-rewrite')).toContain('/doctor/register');

    const adminReg = proxy(
      makeRequest('/register', {}, { host: 'admin.famidoc.online', proto: 'https' }),
    );
    expect(adminReg.status).toBe(307);
    expect(adminReg.headers.get('location')).toBe('https://admin.famidoc.online/login');
  });

  it('điều hướng / trên subdomain tới /login hoặc dashboard theo trạng thái phiên', () => {
    const guestAdminRoot = proxy(
      makeRequest('/', {}, { host: 'admin.famidoc.online', proto: 'https' }),
    );
    expect(guestAdminRoot.status).toBe(307);
    expect(guestAdminRoot.headers.get('location')).toBe('https://admin.famidoc.online/login');

    const authedAdminRoot = proxy(
      makeRequest(
        '/',
        { famidoc_token: 'jwt', famidoc_role: 'ADMIN' },
        { host: 'admin.famidoc.online', proto: 'https' },
      ),
    );
    expect(authedAdminRoot.status).toBe(307);
    expect(authedAdminRoot.headers.get('location')).toBe('https://admin.famidoc.online/admin');
  });

  it('giữ redirect URL khi chưa đăng nhập vào /admin/users hoặc /settings trên admin subdomain', () => {
    const adminDeepRes = proxy(
      makeRequest('/admin/users?page=2', {}, { host: 'admin.famidoc.online', proto: 'https' }),
    );
    expect(adminDeepRes.status).toBe(307);
    expect(adminDeepRes.headers.get('location')).toBe(
      'https://admin.famidoc.online/login?redirect=%2Fadmin%2Fusers%3Fpage%3D2',
    );

    const settingsGuest = proxy(
      makeRequest('/settings', {}, { host: 'admin.famidoc.online', proto: 'https' }),
    );
    expect(settingsGuest.status).toBe(307);
    expect(settingsGuest.headers.get('location')).toBe(
      'https://admin.famidoc.online/login?redirect=%2Fsettings',
    );

    const settingsAuthed = proxy(
      makeRequest(
        '/settings',
        { famidoc_token: 'jwt', famidoc_role: 'ADMIN' },
        { host: 'admin.famidoc.online', proto: 'https' },
      ),
    );
    expect(settingsAuthed.status).toBe(200);
  });

  it('cô lập chéo phân hệ trên subdomain và chuyển hướng route chuyên biệt từ famidoc.online sang subdomain', () => {
    const wrongSection = proxy(
      makeRequest(
        '/doctor/contracts',
        { famidoc_token: 'jwt', famidoc_role: 'ADMIN' },
        { host: 'admin.famidoc.online', proto: 'https' },
      ),
    );
    expect(wrongSection.status).toBe(307);
    expect(wrongSection.headers.get('location')).toBe('https://admin.famidoc.online/admin');

    const mainAdmin = proxy(
      makeRequest('/admin/users', {}, { host: 'famidoc.online', proto: 'https' }),
    );
    expect(mainAdmin.status).toBe(307);
    expect(mainAdmin.headers.get('location')).toBe('https://admin.famidoc.online/admin/users');

    const mainFacilityLogin = proxy(
      makeRequest('/facility/login', {}, { host: 'famidoc.online', proto: 'https' }),
    );
    expect(mainFacilityLogin.status).toBe(307);
    expect(mainFacilityLogin.headers.get('location')).toBe('https://csyt.famidoc.online/login');
  });
});

describe('proxy - không đổi hành vi cũ', () => {
  it('cho qua trang đăng nhập', () => {
    const response = proxy(makeRequest('/login'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('cho qua khi người dùng đã đăng nhập đúng vai trò', () => {
    const response = proxy(
      makeRequest('/family/subscription/tracking?contractId=abc', {
        famidoc_token: 'jwt',
        famidoc_role: 'FAMILY',
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('vẫn đẩy về trang mặc định của vai trò khi sai phân hệ trên IP thuần 127.0.0.1:3000', () => {
    const response = proxy(
      makeRequest(
        '/doctor/contracts',
        {
          famidoc_token: 'jwt',
          famidoc_role: 'FAMILY',
        },
        { host: '127.0.0.1:3000', proto: 'http' },
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/family');
  });
});

describe('proxy - dọn cookie sai cổng trên trang khách hàng và matcher công khai', () => {
  it.each(['ADMIN', 'FACILITY', 'DOCTOR'])(
    'xóa cookie %s khi truy cập trang chủ famidoc.online/',
    (role) => {
      const response = proxy(
        makeRequest(
          '/',
          {
            [COOKIE_KEYS.ROLE]: role,
            [COOKIE_KEYS.TOKEN]: 'stale-jwt',
            [COOKIE_KEYS.USER]: encodeURIComponent(JSON.stringify({ id: 'u1', name: 'Staff' })),
          },
          { host: 'famidoc.online', proto: 'https' },
        ),
      );

      expect(response.status).toBe(200);
      const setCookie = response.headers.get('set-cookie') || '';
      expect(setCookie).toContain(`${COOKIE_KEYS.ROLE}=;`);
      expect(setCookie).toContain(`${COOKIE_KEYS.TOKEN}=;`);
      expect(setCookie).toContain(`${COOKIE_KEYS.USER}=;`);
    },
  );

  it.each(['ADMIN', 'FACILITY', 'DOCTOR'])(
    'xóa cookie %s khi truy cập localhost:3000/packages',
    (role) => {
      const response = proxy(
        makeRequest(
          '/packages',
          {
            [COOKIE_KEYS.ROLE]: role,
            [COOKIE_KEYS.TOKEN]: 'stale-jwt',
          },
          { host: 'localhost:3000', proto: 'http' },
        ),
      );

      expect(response.status).toBe(200);
      const setCookie = response.headers.get('set-cookie') || '';
      expect(setCookie).toContain(`${COOKIE_KEYS.ROLE}=;`);
      expect(setCookie).toContain(`${COOKIE_KEYS.TOKEN}=;`);
      expect(setCookie).toContain(`${COOKIE_KEYS.USER}=;`);
    },
  );

  it('không xóa cookie FAMILY trên trang công khai và không xóa cookie ADMIN trên 127.0.0.1:3000/', () => {
    const familyRes = proxy(
      makeRequest(
        '/packages',
        {
          [COOKIE_KEYS.ROLE]: 'FAMILY',
          [COOKIE_KEYS.TOKEN]: 'family-jwt',
        },
        { host: 'famidoc.online', proto: 'https' },
      ),
    );
    expect(familyRes.status).toBe(200);
    expect(familyRes.headers.get('set-cookie')).toBeNull();

    const ipAdminRes = proxy(
      makeRequest(
        '/',
        {
          [COOKIE_KEYS.ROLE]: 'ADMIN',
          [COOKIE_KEYS.TOKEN]: 'admin-jwt',
        },
        { host: '127.0.0.1:3000', proto: 'http' },
      ),
    );
    expect(ipAdminRes.status).toBe(200);
    expect(ipAdminRes.headers.get('set-cookie')).toBeNull();
  });

  it('phủ các tuyến công khai khách hàng trong config.matcher', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        '/packages',
        '/doctors',
        '/facilities',
        '/onboarding',
        '/contact',
        '/blog',
        '/privacy',
        '/terms',
      ]),
    );
  });
});
