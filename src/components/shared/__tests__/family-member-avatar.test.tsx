import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FamilyMemberAvatar,
  resolveMemberAvatarKind,
} from '../family-member-avatar';
import {
  MedicalDomainIcon,
  type MedicalDomainIconName,
} from '../medical-domain-icon';

describe('FamilyMemberAvatar & resolveMemberAvatarKind', () => {
  it('resolves demographic avatar kinds across age and gender groups', () => {
    expect(resolveMemberAvatarKind({ gender: 'FEMALE', age: 68 })).toBe('elderly-woman');
    expect(resolveMemberAvatarKind({ gender: 'MALE', age: 72 })).toBe('elderly-man');
    expect(resolveMemberAvatarKind({ gender: 'FEMALE', age: 10 })).toBe('girl');
    expect(resolveMemberAvatarKind({ gender: 'MALE', age: 12 })).toBe('boy');
    expect(resolveMemberAvatarKind({ gender: 'FEMALE', age: 35 })).toBe('woman');
    expect(resolveMemberAvatarKind({ gender: 'MALE', age: 40 })).toBe('man');
    expect(resolveMemberAvatarKind({ gender: 'OTHER', age: 30 })).toBe('person');
  });

  it('renders an SVG without any emoji characters and respects accessibility attributes', () => {
    const { container } = render(
      <FamilyMemberAvatar gender="MALE" age={68} title="Ông nội" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('data-avatar-kind', 'elderly-man');
    expect(screen.getByTitle('Ông nội')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/👵|👨‍🦳|👧|👦|👩|👨|🧑/);
  });
});

describe('MedicalDomainIcon', () => {
  it.each<MedicalDomainIconName>([
    'doctor',
    'blood-pressure',
    'spo2',
    'heart-rate',
    'glucose',
    'prescription',
    'medical-book',
    'home-visit',
    'telemedicine',
  ])('renders SVG for medical domain icon "%s"', (name) => {
    const { container } = render(<MedicalDomainIcon name={name} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('data-medical-icon', name);
  });
});
