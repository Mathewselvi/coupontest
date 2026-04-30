export default function Pagination({ page, totalPages, total, limit, onChange }) {
    if (totalPages <= 1) return null;

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
        pages.push(i);
    }

    return (
        <div className="pagination">
            <span className="page-info">{start}–{end} of {total}</span>
            <div className="page-btns">
                <button className="page-btn" onClick={() => onChange(1)} disabled={page === 1}>«</button>
                <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>‹</button>
                {pages[0] > 1 && <span className="page-ellipsis">…</span>}
                {pages.map(p => (
                    <button
                        key={p}
                        className={`page-btn ${p === page ? 'active' : ''}`}
                        onClick={() => onChange(p)}
                    >{p}</button>
                ))}
                {pages[pages.length - 1] < totalPages && <span className="page-ellipsis">…</span>}
                <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>›</button>
                <button className="page-btn" onClick={() => onChange(totalPages)} disabled={page === totalPages}>»</button>
            </div>
        </div>
    );
}
