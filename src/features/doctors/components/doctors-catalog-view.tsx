'use client';

import { useState, useMemo, useCallback } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { DoctorCard } from '@/features/doctors/components/doctor-card';
import { DoctorItem } from '@/features/doctors/schemas/doctor-catalog.schema';
import {
  mockDoctorsList,
} from '@/features/doctors/data/mock-doctors';
import { cn } from '@/lib/utils';

const SPECIALTIES = [
  'Tất cả',
  'Nội tổng quát',
  'Nhi khoa',
  'Lão khoa',
  'Tim mạch',
];

export function DoctorsCatalogView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Lọc dữ liệu
  const filteredDoctors = useMemo((): DoctorItem[] => {
    let result = [...mockDoctorsList];

    // Lọc theo chuyên khoa
    if (selectedSpecialty !== 'Tất cả') {
      result = result.filter((d) => d.specialty === selectedSpecialty);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(term) || d.cchn.toLowerCase().includes(term)
      );
    }

    return result;
  }, [selectedSpecialty, searchTerm]);

  // Tính tổng số trang dựa trên danh sách đã lọc (không phải toàn bộ dữ liệu)
  const totalPages = Math.max(Math.ceil(filteredDoctors.length / pageSize), 1);

  // Cắt trang hiện tại
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [filteredDoctors, currentPage]);

  // Reset về trang 1 khi thay đổi bộ lọc
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
    },
    []
  );

  const handleSpecialtyChange = useCallback(
    (specialty: string) => {
      setSelectedSpecialty(specialty);
      setCurrentPage(1);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSpecialty('Tất cả');
    setCurrentPage(1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface">Tra cứu Danh bạ Bác sĩ</h1>
        <p className="text-sm text-on-surface-variant">
          Tìm kiếm và đặt lịch khám với {mockDoctorsList.length} bác sĩ chuyên khoa trên toàn quốc
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <input
          type="search"
          placeholder="Tìm kiếm theo tên hoặc số CCHN..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Tìm kiếm bác sĩ"
          className={cn(
            'w-full rounded-lg border border-outline-variant bg-surface-container-lowest',
            'py-2.5 px-4 pr-10 text-sm text-on-surface placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow'
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined text-lg">
          search
        </span>
      </div>

      {/* Specialty tabs */}
      <div role="tablist" aria-label="Chuyên khoa" className="flex flex-wrap gap-2">
        {SPECIALTIES.map((specialty) => (
          <button
            key={specialty}
            role="tab"
            aria-selected={selectedSpecialty === specialty}
            onClick={() => handleSpecialtyChange(specialty)}
            aria-label={`Chuyên khoa ${specialty}`}
            className={cn(
              'min-h-[40px] rounded-full px-4 py-2 text-xs font-semibold transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              selectedSpecialty === specialty
                ? 'bg-primary text-white'
                : 'bg-surface-container-lowest text-on-surface hover:bg-primary-container/10'
            )}
          >
            {specialty}
          </button>
        ))}
      </div>

      {/* Results count or empty state */}
      {filteredDoctors.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center py-16 space-y-3 text-center"
        >
          <span className="material-symbols-outlined text-5xl text-muted-foreground">
            person_off
          </span>
          <p className="text-sm font-medium text-on-surface-variant">
            Không tìm thấy bác sĩ phù hợp
          </p>
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Xóa bộ lọc"
            className={cn(
              'min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold',
              'bg-primary text-white hover:bg-primary-container hover:text-primary',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* Doctor cards grid — Bento Grid layout */}
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
            )}
          >
            {paginatedDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Hiển thị {paginatedDoctors.length} trong tổng {filteredDoctors.length} bác sĩ
            </span>
            <span>Trang {currentPage} / {totalPages}</span>
          </div>

          {/* Pagination component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
