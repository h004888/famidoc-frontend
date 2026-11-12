import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui/pagination';

describe('UT-CMP-Pagination: Pagination component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: vi.fn(),
  };

  it('renders correct page numbers and Previous/Next buttons', () => {
    render(<Pagination {...defaultProps} />);

    // Check page numbers
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }

    // Check Previous and Next buttons
    expect(screen.getByText('Trước')).toBeInTheDocument();
    expect(screen.getByText('Sau')).toBeInTheDocument();
  });

  it('Previous button is disabled when currentPage === 1', () => {
    render(<Pagination {...defaultProps} />);
    const prevButton = screen.getByText('Trước');
    expect(prevButton).toBeDisabled();
  });

  it('Next button is disabled when currentPage === totalPages', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const nextButton = screen.getByText('Sau');
    expect(nextButton).toBeDisabled();
  });

  it('Previous button is enabled when currentPage > 1', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    const prevButton = screen.getByText('Trước');
    expect(prevButton).not.toBeDisabled();
  });

  it('Next button is enabled when currentPage < totalPages', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    const nextButton = screen.getByText('Sau');
    expect(nextButton).not.toBeDisabled();
  });

  it('clicking a page number triggers onPageChange(pageNumber)', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={1}
        onPageChange={handlePageChange}
      />
    );

    fireEvent.click(screen.getByText('3'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('clicking Previous button triggers onPageChange(currentPage - 1)', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={3}
        onPageChange={handlePageChange}
      />
    );

    fireEvent.click(screen.getByText('Trước'));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('clicking Next button triggers onPageChange(currentPage + 1)', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={2}
        onPageChange={handlePageChange}
      />
    );

    fireEvent.click(screen.getByText('Sau'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('aria-current="page" appears on current page', () => {
    render(<Pagination {...defaultProps} currentPage={2} />);
    // Find the clickable with aria-current="page"
    const pageLink = document.querySelector('[aria-current="page"]');
    expect(pageLink).toHaveAttribute('aria-current', 'page');
    expect(pageLink!.textContent).toBe('2');
  });

  it('has aria-labels on navigation buttons', () => {
    render(<Pagination {...defaultProps} />);
    const prevButton = screen.getByText('Trước');
    const nextButton = screen.getByText('Sau');
    expect(prevButton).toHaveAttribute('aria-label', 'Chuyển đến trang trước');
    expect(nextButton).toHaveAttribute('aria-label', 'Chuyển đến trang sau');
  });

  it('each page number has aria-label="Chuyển đến trang X"', () => {
    render(<Pagination {...defaultProps} />);
    for (let i = 1; i <= 5; i++) {
      const pageEl = document.querySelector(`[aria-label="Chuyển đến trang ${i}"]`);
      expect(pageEl).toBeTruthy();
    }
  });

  it('handles single page (totalPages === 1)', () => {
    render(
      <Pagination
        {...defaultProps}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    // When only 1 page, no prev/next buttons should appear, just the current page
    expect(screen.queryByText('Trước')).not.toBeInTheDocument();
    expect(screen.queryByText('Sau')).not.toBeInTheDocument();
  });

  it('shows only current page when totalPages is 1', () => {
    render(<Pagination {...defaultProps} totalPages={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not render when totalPages is 0', () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={0} onPageChange={vi.fn()} />
    );
    expect(container.querySelectorAll('nav').length).toBe(0);
  });
});
