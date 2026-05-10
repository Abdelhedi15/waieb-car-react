import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination component
 * Props:
 *   currentPage  : number (1-based)
 *   totalPages   : number
 *   onPageChange : (page) => void
 *   totalItems   : number  (optional, for "X résultats" label)
 *   itemsPerPage : number  (optional)
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const from = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const to   = itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  // Build page window: always show first, last, current ±1
  const getPages = () => {
    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages]
      .filter(p => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  };

  const pages = getPages();

  const btnStyle = (active) => ({
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: active ? 'none' : '1.5px solid #DDE3ED',
    background: active ? '#1B3A6B' : 'white',
    color: active ? 'white' : '#1A2535',
    fontWeight: active ? '800' : '500',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.14s',
    flexShrink: 0,
  });

  const arrowStyle = (disabled) => ({
    ...btnStyle(false),
    color: disabled ? '#C8D0DC' : '#1B3A6B',
    borderColor: disabled ? '#EEF0F4' : '#DDE3ED',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#FAFAFA' : 'white',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #DDE3ED' }}>
      {/* Info */}
      <div style={{ fontSize: '12.5px', color: '#64748B' }}>
        {totalItems != null && itemsPerPage != null
          ? <><strong style={{ color: '#1A2535' }}>{from}–{to}</strong> sur <strong style={{ color: '#1A2535' }}>{totalItems}</strong> résultats</>
          : <><strong style={{ color: '#1A2535' }}>{currentPage}</strong> / {totalPages} pages</>
        }
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* First */}
        <button style={arrowStyle(currentPage === 1)} disabled={currentPage === 1}
          onClick={() => onPageChange(1)} title="Première page">
          <ChevronsLeft size={14} />
        </button>
        {/* Prev */}
        <button style={arrowStyle(currentPage === 1)} disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)} title="Page précédente">
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers with ellipsis */}
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev && p - prev > 1;
          return (
            <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {showEllipsis && (
                <span style={{ color: '#94A3B8', fontSize: '13px', padding: '0 2px' }}>…</span>
              )}
              <button
                style={btnStyle(p === currentPage)}
                onClick={() => onPageChange(p)}
                onMouseEnter={e => { if (p !== currentPage) { e.currentTarget.style.background = '#F5F7FA'; e.currentTarget.style.borderColor = '#1B3A6B'; } }}
                onMouseLeave={e => { if (p !== currentPage) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#DDE3ED'; } }}
              >
                {p}
              </button>
            </span>
          );
        })}

        {/* Next */}
        <button style={arrowStyle(currentPage === totalPages)} disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)} title="Page suivante">
          <ChevronRight size={14} />
        </button>
        {/* Last */}
        <button style={arrowStyle(currentPage === totalPages)} disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)} title="Dernière page">
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;