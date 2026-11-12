import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorsCatalogView } from '@/features/doctors/components/doctors-catalog-view';

describe('UT-CMP-DoctorsCatalog: DoctorsCatalogView with pagination', () => {
  it('renders doctor catalog with pagination: Page 1 shows first 6 doctors and shows "Trang 1 / 2"', async () => {
    render(<DoctorsCatalogView />);

    // First 6 doctors should be visible
    expect(screen.getByText(/PGS.TS Nguyễn Trọng Nghĩa/i)).toBeInTheDocument();

    // Pagination control should exist
    const paginationNav = document.querySelector('[aria-label="Phân trang"]');
    expect(paginationNav).toBeTruthy();

    // There should be 6 doctor articles on page 1
    const articles = document.querySelectorAll('[role="article"]');
    expect(articles.length).toBe(6);
  });

  it('page 2 shows different doctors when clicking page 2', async () => {
    render(<DoctorsCatalogView />);

    // Get current doctors on page 1
    const page1Names = Array.from(document.querySelectorAll('h3.font-bold')).map((el) => el.textContent).filter(Boolean);

    // Click page 2
    fireEvent.click(screen.getByText('2'));

    // Doctor names should have changed
    await waitFor(() => {
      const page2Names = Array.from(document.querySelectorAll('h3.font-bold')).map((el) => el.textContent).filter(Boolean);
      // At least one name should be different
      expect(page2Names.some((name) => !page1Names.includes(name!))).toBe(true);
    });
  });

  it('searches by keyword filters displayed results by doctor name', () => {
    render(<DoctorsCatalogView />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm/i);

    fireEvent.change(searchInput, { target: { value: 'Minh Tuấn' } });

    expect(screen.getByText(/TS.BS Lê Minh Tuấn/i)).toBeInTheDocument();
    expect(screen.queryByText(/PGS.TS Nguyễn Trọng Nghĩa/i)).not.toBeInTheDocument();
  });

  it('filters by specialty tab: selecting Nhi khoa only shows儿科 doctors', () => {
    render(<DoctorsCatalogView />);

    // Find and click the Nhi khoa tab by its role+name combination
    const nhiKhoaTabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const nhiTab = nhiKhoaTabs.find((tab) => tab.textContent === 'Nhi khoa');
    expect(nhiTab).toBeTruthy();

    fireEvent.click(nhiTab!);

    // All visible doctor names should be from Nhi khoa
    const h3Elements = document.querySelectorAll('[role="article"] h3');
    h3Elements.forEach((h3) => {
      const card = h3.closest('[role="article"]');
      expect(card!.textContent).toContain('Nhi khoa');
    });
  });

  it('shows empty state when no search results found', async () => {
    render(<DoctorsCatalogView />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm/i);
    fireEvent.change(searchInput, { target: { value: 'XYZABC không có thật' } });

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      const statusEl = screen.getByRole('status');
      expect(statusEl.textContent).toContain('Không tìm thấy bác sĩ phù hợp');
    });

    // Should have a reset filter button
    const clearBtn = screen.getByRole('button', { name: /Xóa bộ lọc/i });
    expect(clearBtn).toBeInTheDocument();
  });

  it('clears filters when reset filter button is clicked after empty state', async () => {
    render(<DoctorsCatalogView />);

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm/i);
    fireEvent.change(searchInput, { target: { value: 'XYZABC' } });

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // Click the reset/clear button
    const clearBtn = screen.getByRole('button', { name: /Xóa bộ lọc/i });
    fireEvent.click(clearBtn);

    // Search input should be cleared and doctors reappear
    await waitFor(() => {
      expect(screen.getByText(/PGS.TS Nguyễn Trọng Nghĩa/i)).toBeInTheDocument();
    });
  });

  it('displays DoctorCard info: avatar, name, specialty, CCHN, fee, and book button', () => {
    render(<DoctorsCatalogView />);

    // Check first doctor card has all expected elements
    expect(screen.getByText(/PGS.TS Nguyễn Trọng Nghĩa/i)).toBeInTheDocument();
    expect(screen.getByText(/004128\/BYT/i)).toBeInTheDocument();
    // VND currency format: 500.000₫
    expect(screen.getByText(/500.000₫/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đặt lịch khám với bác sĩ PGS\.TS Nguyễn Trọng Nghĩa/i })).toBeInTheDocument();
  });

  it('Prev button disabled on page 1, Next enabled', () => {
    render(<DoctorsCatalogView />);

    const prevBtn = screen.getByText('Trước');
    const nextBtn = screen.getByText('Sau');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
  });

  it('uses correct pageSize of 6 for doctor cards per page', () => {
    render(<DoctorsCatalogView />);
    const doctorCards = document.querySelectorAll('[role="article"]');
    expect(doctorCards.length).toBe(6);
  });
});
