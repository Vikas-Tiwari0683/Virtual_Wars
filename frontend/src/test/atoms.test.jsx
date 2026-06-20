// =============================================================================
// SECTION: Atom Component Tests
// Covers Badge and Button — including the unknown-variant fallback fix.
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Badge from '../components/atoms/Badge';
import Button from '../components/atoms/Button';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies the green variant class', () => {
    render(<Badge variant="green">Saved</Badge>);
    expect(screen.getByText('Saved').className).toContain('bg-[#b1f2be]');
  });

  it('falls back to default class for an unknown variant (no "undefined" in class)', () => {
    render(<Badge variant="banana">Oops</Badge>);
    const el = screen.getByText('Oops');
    expect(el.className).not.toContain('undefined');
    expect(el.className).toContain('bg-[#e9edff]'); // default variant
  });

  it('merges custom className', () => {
    render(<Badge className="custom-x">Tag</Badge>);
    expect(screen.getByText('Tag').className).toContain('custom-x');
  });
});

describe('Button', () => {
  it('renders children and defaults to type="button"', () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole('button', { name: 'Click' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Nope</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Nope' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies fullWidth class when set', () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole('button', { name: 'Wide' }).className).toContain('w-full');
  });

  it('applies the secondary variant styling', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: 'Secondary' }).className).toContain('border-[#006b2c]');
  });
});
