(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/dashboard/components/ConfirmDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConfirmDialog",
    ()=>ConfirmDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = true, loading = false, error = '', onConfirm, onCancel }) {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConfirmDialog.useEffect": ()=>{
            function onKey(e) {
                if (e.key === 'Escape' && !loading) onCancel();
            }
            document.addEventListener('keydown', onKey);
            return ({
                "ConfirmDialog.useEffect": ()=>document.removeEventListener('keydown', onKey)
            })["ConfirmDialog.useEffect"];
        }
    }["ConfirmDialog.useEffect"], [
        loading,
        onCancel
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "deactivate-modal open",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        onClick: ()=>{
            if (!loading) onCancel();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "deactivate-modal-content",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: title
                }, void 0, false, {
                    fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
                    lineNumber: 53,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: message
                }, void 0, false, {
                    fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
                    lineNumber: 54,
                    columnNumber: 9
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "form-error",
                    role: "alert",
                    style: {
                        marginTop: 8
                    },
                    children: error
                }, void 0, false, {
                    fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
                    lineNumber: 56,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "deactivate-modal-actions",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn btn-secondary",
                            onClick: onCancel,
                            disabled: loading,
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
                            lineNumber: 61,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: `btn ${danger ? 'btn-danger' : 'btn-primary'}`,
                            onClick: onConfirm,
                            disabled: loading,
                            autoFocus: true,
                            children: loading ? 'Working…' : confirmLabel
                        }, void 0, false, {
                            fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
                    lineNumber: 60,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
            lineNumber: 52,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/dashboard/components/ConfirmDialog.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(ConfirmDialog, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = ConfirmDialog;
var _c;
__turbopack_context__.k.register(_c, "ConfirmDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/dashboard/components/ProductsGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProductsGrid",
    ()=>ProductsGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$components$2f$Select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashboard/components/Select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$components$2f$ConfirmDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dashboard/components/ConfirmDialog.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
/* ─── Helpers ─────────────────────────────────────────────────────────────── */ function formatKes(cents) {
    return `KES ${(cents / 100).toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
function initials(name) {
    return name.split(' ').slice(0, 2).map((w)=>w[0]?.toUpperCase() ?? '').join('');
}
/**
 * Seeded products store full external URLs (Unsplash) in imageKey while
 * R2 uploads store object keys resolved to imageUrl by the backend.
 * Prefer imageUrl, fall back to imageKey when it is already a URL so seeded
 * images render even if the backend version predates imageUrl.
 */ function resolveImageUrl(p) {
    if (p.imageUrl) return p.imageUrl;
    if (p.imageKey && /^https?:\/\//i.test(p.imageKey)) return p.imageKey;
    return null;
}
/** Must stay in sync with backend R2Service.mimeFromExt — the presigned PUT is signed with this value. */ function mimeFromFilename(filename) {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.avif': 'image/avif'
    };
    return map[ext] ?? 'application/octet-stream';
}
const ACCEPTED_EXT = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
/* ─── ProductCard ─────────────────────────────────────────────────────────── */ function ProductCard({ product, onEdit, highlighted = false }) {
    _s();
    const margin = product.marginPct;
    const marginColor = margin === null ? 'var(--text-muted)' : margin >= 20 ? 'var(--accent-emerald)' : margin >= 0 ? 'var(--accent-amber)' : 'var(--accent-rose)';
    const cardImageUrl = resolveImageUrl(product);
    const [imgFailed, setImgFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const showImg = Boolean(cardImageUrl) && !imgFailed;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onEdit,
        style: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            outline: highlighted ? '2px solid var(--accent-primary)' : 'none',
            outlineOffset: 2
        },
        onMouseEnter: (e)=>{
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
        },
        onMouseLeave: (e)=>{
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: product.active ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    boxShadow: product.active ? '0 0 0 2px rgba(95,173,124,0.25)' : 'none'
                }
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    width: '100%',
                    height: 160,
                    background: 'var(--bg-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    borderBottom: '1px solid var(--border-subtle)'
                },
                children: showImg ? // eslint-disable-next-line @next/next/no-img-element
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: cardImageUrl,
                    alt: product.name,
                    loading: "lazy",
                    referrerPolicy: "no-referrer",
                    style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                    },
                    onError: ()=>setImgFailed(true)
                }, void 0, false, {
                    fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                    lineNumber: 129,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    style: {
                        fontSize: 32,
                        fontWeight: 800,
                        color: 'var(--border-strong)',
                        letterSpacing: '-0.02em'
                    },
                    children: initials(product.name)
                }, void 0, false, {
                    fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                    lineNumber: 138,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: '14px 16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase'
                        },
                        children: product.sku
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.3
                        },
                        children: product.name
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this),
                    product.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        },
                        children: product.description
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 153,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 'auto',
                            paddingTop: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            fontVariantNumeric: 'tabular-nums'
                                        },
                                        children: formatKes(product.priceCents)
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 159,
                                        columnNumber: 13
                                    }, this),
                                    product.costCents !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 11,
                                            color: 'var(--text-muted)',
                                            marginTop: 1
                                        },
                                        children: [
                                            "Cost: ",
                                            formatKes(product.costCents)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 163,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 158,
                                columnNumber: 11
                            }, this),
                            margin !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    textAlign: 'right'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: marginColor,
                                            fontVariantNumeric: 'tabular-nums'
                                        },
                                        children: [
                                            margin,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 170,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 10,
                                            color: 'var(--text-muted)'
                                        },
                                        children: "margin"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 173,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 169,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: '8px 16px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface-elevated)'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: 11,
                            color: 'var(--text-muted)'
                        },
                        children: [
                            product.unitType,
                            product.isWeighed ? ' · weighed' : ''
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 186,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                            background: product.active ? 'var(--accent-emerald-bg)' : 'var(--bg-surface-subtle)',
                            color: product.active ? 'var(--accent-emerald)' : 'var(--text-muted)'
                        },
                        children: product.active ? 'Active' : 'Inactive'
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 180,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
        lineNumber: 85,
        columnNumber: 5
    }, this);
}
_s(ProductCard, "JcPs102XE9TFjwikWKWNUDaZLtU=");
_c = ProductCard;
/* ─── EditPanel (Slide-over) ──────────────────────────────────────────────── */ function EditPanel({ product, categories, taxCategories, onClose, onSaved }) {
    _s1();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isCreate = !product;
    // Form state mirrors product fields
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.name ?? '');
    const [description, setDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.description ?? '');
    const [sku, setSku] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.sku ?? '');
    const [barcode, setBarcode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.barcode ?? '');
    const [priceCents, setPriceCents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product ? String(product.priceCents / 100) : '');
    const [costCents, setCostCents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.costCents !== null && product?.costCents !== undefined ? String(product.costCents / 100) : '');
    const [categoryId, setCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.categoryId ?? '');
    const [taxCategoryId, setTaxCategoryId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.taxCategory?.id ?? '');
    const [unitType, setUnitType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.unitType ?? 'each');
    const [isWeighed, setIsWeighed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.isWeighed ?? false);
    const [reorderPoint, setReorderPoint] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.reorderPoint !== null && product?.reorderPoint !== undefined ? String(product.reorderPoint) : '');
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(product?.active ?? true);
    const [imagePreview, setImagePreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [uploading, setUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [removing, setRemoving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [confirmRemove, setConfirmRemove] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imgError, setImgError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const baseImageUrl = product ? resolveImageUrl(product) : null;
    const displayUrl = imagePreview ?? baseImageUrl;
    const [panelImgFailed, setPanelImgFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const showPanelImg = Boolean(displayUrl) && !panelImgFailed;
    /* ── Live Profit & Margin Calculation (Continuous as user types) ── */ const parsedPrice = parseFloat(priceCents);
    const parsedCost = costCents.trim() ? parseFloat(costCents) : null;
    const livePriceCents = !isNaN(parsedPrice) && parsedPrice >= 0 ? Math.round(parsedPrice * 100) : null;
    const liveCostCents = parsedCost !== null && !isNaN(parsedCost) && parsedCost >= 0 ? Math.round(parsedCost * 100) : null;
    const liveProfitCents = livePriceCents !== null && liveCostCents !== null ? livePriceCents - liveCostCents : null;
    const liveMarginPct = livePriceCents !== null && livePriceCents > 0 && liveProfitCents !== null ? Math.round(liveProfitCents / livePriceCents * 1000) / 10 : null;
    /* ── Image upload ── */ async function handleImageFile(file) {
        if (!product) return;
        setImgError('');
        if (!ACCEPTED_EXT.test(file.name)) {
            setImgError('Use jpg, png, webp, gif, or avif');
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            setImgError('Max 4 MB');
            return;
        }
        setUploading(true);
        setPanelImgFailed(false);
        setImagePreview(URL.createObjectURL(file));
        try {
            const presignRes = await fetch(`/api/proxy/products/${product.id}/image/presign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    filename: file.name
                })
            });
            if (!presignRes.ok) {
                const data = await presignRes.json().catch(()=>({}));
                const msg = presignRes.status === 503 ? 'Image storage is not configured on the server. Set R2 env vars and restart backend.' : typeof data.message === 'string' ? data.message : 'Presign failed';
                throw new Error(msg);
            }
            const { uploadUrl, key, contentType } = await presignRes.json();
            const putType = contentType || mimeFromFilename(file.name);
            const putRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': putType
                },
                body: file
            });
            if (!putRes.ok) throw new Error('Upload to storage failed');
            const patchRes = await fetch(`/api/proxy/products/${product.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    imageKey: key
                })
            });
            if (!patchRes.ok) {
                const data = await patchRes.json().catch(()=>({}));
                throw new Error(typeof data.message === 'string' ? data.message : 'Failed to save image');
            }
            const updated = await patchRes.json();
            onSaved(updated, false);
            setImagePreview(null);
            setPanelImgFailed(false);
            router.refresh();
        } catch (e) {
            setImgError(e instanceof Error ? e.message : 'Upload failed');
            setImagePreview(null);
        } finally{
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
    async function handleRemoveImage() {
        if (!product) return false;
        setImgError('');
        setRemoving(true);
        try {
            const res = await fetch(`/api/proxy/products/${product.id}/image`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) {
                const data = await res.json().catch(()=>({}));
                throw new Error(typeof data.message === 'string' ? data.message : 'Failed to remove image');
            }
            setImagePreview(null);
            setPanelImgFailed(false);
            onSaved({
                ...product,
                imageKey: null,
                imageUrl: null
            }, false);
            router.refresh();
            return true;
        } catch (e) {
            setImgError(e instanceof Error ? e.message : 'Failed to remove image');
            return false;
        } finally{
            setRemoving(false);
        }
    }
    /* ── Save product details ── */ async function handleSave() {
        if (!name.trim()) {
            setError('Product name is required');
            return;
        }
        if (!sku.trim()) {
            setError('SKU is required');
            return;
        }
        const price = parseFloat(priceCents);
        if (isNaN(price) || price < 0) {
            setError('Invalid selling price');
            return;
        }
        const costNum = costCents.trim() ? parseFloat(costCents) : null;
        if (costNum !== null && (isNaN(costNum) || costNum < 0)) {
            setError('Invalid cost price');
            return;
        }
        const reorderNum = reorderPoint.trim() ? parseInt(reorderPoint, 10) : null;
        if (reorderNum !== null && (isNaN(reorderNum) || reorderNum < 0)) {
            setError('Invalid reorder point');
            return;
        }
        const priceCentsVal = Math.round(price * 100);
        const costCentsVal = costNum === null ? null : Math.round(costNum * 100);
        const taxCat = taxCategories.find((t)=>t.id === taxCategoryId) ?? null;
        setSaving(true);
        setError('');
        setSuccess(false);
        try {
            if (isCreate) {
                const body = {
                    name: name.trim(),
                    sku: sku.trim(),
                    description: description.trim() || undefined,
                    barcode: barcode.trim() || undefined,
                    priceCents: priceCentsVal,
                    costCents: costCentsVal ?? undefined,
                    categoryId: categoryId || undefined,
                    taxCategoryId: taxCategoryId || undefined,
                    unitType,
                    isWeighed,
                    reorderPoint: reorderNum ?? undefined,
                    active
                };
                const res = await fetch('/api/proxy/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(body)
                });
                if (!res.ok) {
                    const data = await res.json().catch(()=>({}));
                    throw new Error(typeof data.message === 'string' ? data.message : 'Failed to create product');
                }
                const created = await res.json();
                onSaved(created, true);
                setSuccess(true);
                router.refresh();
                setTimeout(()=>{
                    onClose();
                }, 650);
            } else {
                const profitCentsVal = costCentsVal === null ? null : priceCentsVal - costCentsVal;
                const marginPctVal = costCentsVal === null || priceCentsVal <= 0 || profitCentsVal === null ? null : Math.round(profitCentsVal / priceCentsVal * 1000) / 10;
                const previous = product;
                const optimistic = {
                    ...product,
                    name: name.trim(),
                    description: description.trim() || null,
                    sku: sku.trim(),
                    barcode: barcode.trim() || null,
                    priceCents: priceCentsVal,
                    costCents: costCentsVal,
                    profitCents: profitCentsVal,
                    marginPct: marginPctVal,
                    categoryId: categoryId || null,
                    taxCategory: taxCat ? {
                        id: taxCat.id,
                        name: taxCat.name,
                        rateBp: taxCat.rateBp
                    } : null,
                    unitType,
                    isWeighed,
                    reorderPoint: reorderNum,
                    active
                };
                onSaved(optimistic, false);
                const body = {
                    name: optimistic.name,
                    description: optimistic.description,
                    sku: optimistic.sku,
                    barcode: optimistic.barcode,
                    priceCents: optimistic.priceCents,
                    costCents: optimistic.costCents,
                    categoryId: optimistic.categoryId,
                    taxCategoryId: taxCategoryId || null,
                    unitType: optimistic.unitType,
                    isWeighed: optimistic.isWeighed,
                    reorderPoint: optimistic.reorderPoint,
                    active: optimistic.active
                };
                const res = await fetch(`/api/proxy/products/${product.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(body)
                });
                if (!res.ok) {
                    const data = await res.json().catch(()=>({}));
                    throw new Error(typeof data.message === 'string' ? data.message : 'Save failed');
                }
                setSuccess(true);
                router.refresh();
                setTimeout(()=>{
                    onClose();
                }, 650);
            }
        } catch (e) {
            if (!isCreate && product) {
                onSaved(product, false);
            }
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally{
            setSaving(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onClick: onClose,
                style: {
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.18s ease'
                }
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 442,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 101,
                    width: 520,
                    maxWidth: '100vw',
                    background: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--border-strong)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRight 0.22s var(--ease-spring)',
                    overflowY: 'auto'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px 24px 18px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            position: 'sticky',
                            top: 0,
                            background: 'var(--bg-surface)',
                            zIndex: 10
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    minWidth: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: 'var(--accent-primary)',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            marginBottom: 3
                                        },
                                        children: isCreate ? 'Create Product' : 'Edit Product'
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 468,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        style: {
                                            fontSize: 18,
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1.25
                                        },
                                        children: isCreate ? 'New Product' : product.name
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 471,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: 12,
                                            color: 'var(--text-muted)',
                                            marginTop: 2
                                        },
                                        children: isCreate ? 'Add a new product to inventory catalog' : product.sku
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 474,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 467,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                type: "button",
                                "aria-label": "Close panel",
                                title: "Close",
                                style: {
                                    width: 36,
                                    height: 36,
                                    borderRadius: 'var(--radius-pill)',
                                    background: 'var(--bg-surface-subtle)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    lineHeight: 0,
                                    padding: 0
                                },
                                onMouseEnter: (e)=>{
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                                },
                                onMouseLeave: (e)=>{
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "14",
                                    height: "14",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2.2",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    "aria-hidden": "true",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M18 6 6 18M6 6l12 12"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 494,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                    lineNumber: 493,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 478,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 462,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 24,
                            flex: 1
                        },
                        children: [
                            !isCreate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        style: sectionLabel,
                                        children: "Product Image"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 505,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: 16,
                                            alignItems: 'flex-start'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: 96,
                                                    height: 96,
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'var(--bg-surface-subtle)',
                                                    border: '1px solid var(--border-subtle)',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                },
                                                children: showPanelImg ? // eslint-disable-next-line @next/next/no-img-element
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: displayUrl,
                                                    alt: "",
                                                    loading: "lazy",
                                                    referrerPolicy: "no-referrer",
                                                    onError: ()=>setPanelImgFailed(true),
                                                    style: {
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                    lineNumber: 516,
                                                    columnNumber: 21
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: 28,
                                                        fontWeight: 800,
                                                        color: 'var(--border-strong)'
                                                    },
                                                    children: initials(product.name)
                                                }, void 0, false, {
                                                    fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                    lineNumber: 518,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 508,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 8,
                                                    alignItems: 'flex-start'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>fileInputRef.current?.click(),
                                                        disabled: uploading || removing,
                                                        style: {
                                                            ...secondaryBtn,
                                                            minHeight: 40,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 8
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                "aria-hidden": "true",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                        lineNumber: 529,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "m17 8-5-5-5 5"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                        lineNumber: 530,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M12 3v12"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                        lineNumber: 531,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 528,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: uploading ? 'Uploading…' : displayUrl ? 'Replace Image' : 'Upload Image'
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 533,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 522,
                                                        columnNumber: 19
                                                    }, this),
                                                    displayUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>{
                                                            setImgError('');
                                                            setConfirmRemove(true);
                                                        },
                                                        disabled: uploading || removing,
                                                        style: {
                                                            ...dangerBtn,
                                                            minHeight: 40,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 8
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                "aria-hidden": "true",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M3 6h18"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                        lineNumber: 538,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                        lineNumber: 539,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                        lineNumber: 540,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 537,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: removing ? 'Removing…' : 'Remove Image'
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 542,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 536,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        style: {
                                                            fontSize: 11,
                                                            color: 'var(--text-muted)'
                                                        },
                                                        children: "JPG, PNG, WebP · Max 4 MB"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 545,
                                                        columnNumber: 19
                                                    }, this),
                                                    imgError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        role: "alert",
                                                        style: {
                                                            fontSize: 11,
                                                            color: 'var(--accent-rose)'
                                                        },
                                                        children: imgError
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 546,
                                                        columnNumber: 32
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 521,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 506,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        ref: fileInputRef,
                                        type: "file",
                                        accept: ".jpg,.jpeg,.png,.webp,.gif,.avif",
                                        style: {
                                            display: 'none'
                                        },
                                        onChange: (e)=>{
                                            const f = e.target.files?.[0];
                                            if (f) handleImageFile(f);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 549,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 504,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                                style: fieldset,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                        style: legendStyle,
                                        children: "Basic Info"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 556,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "form-grid-2col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: inputLabel,
                                                        children: "Product Name *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 559,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        style: inputStyle,
                                                        value: name,
                                                        onChange: (e)=>setName(e.target.value),
                                                        placeholder: "e.g. Jogoo Maize Flour 2kg",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 560,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 558,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: inputLabel,
                                                        children: "SKU *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 563,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        style: {
                                                            ...inputStyle,
                                                            fontFamily: 'var(--font-mono)',
                                                            fontSize: 12
                                                        },
                                                        value: sku,
                                                        onChange: (e)=>setSku(e.target.value),
                                                        placeholder: "e.g. UNG-001",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 564,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 562,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 557,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: formGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: inputLabel,
                                                children: "Description"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 568,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                style: {
                                                    ...inputStyle,
                                                    minHeight: 72,
                                                    resize: 'vertical',
                                                    lineHeight: 1.5
                                                },
                                                value: description,
                                                onChange: (e)=>setDescription(e.target.value),
                                                placeholder: "Short product description (optional)"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 569,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 567,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: formGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: inputLabel,
                                                children: "Barcode / EAN"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 577,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                style: {
                                                    ...inputStyle,
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: 12
                                                },
                                                value: barcode,
                                                onChange: (e)=>setBarcode(e.target.value),
                                                placeholder: "e.g. 616110000101"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 578,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 576,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 555,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                                style: fieldset,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                        style: legendStyle,
                                        children: "Pricing & Tax"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 584,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "form-grid-2col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: inputLabel,
                                                        children: "Selling Price (KES) *"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 587,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: inputWithPrefix,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: prefixStyle,
                                                                children: "KES"
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 589,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                style: {
                                                                    ...inputStyle,
                                                                    paddingLeft: 48,
                                                                    fontVariantNumeric: 'tabular-nums'
                                                                },
                                                                type: "number",
                                                                min: 0,
                                                                step: 0.01,
                                                                value: priceCents,
                                                                onChange: (e)=>setPriceCents(e.target.value),
                                                                placeholder: "0.00",
                                                                required: true
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 590,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 588,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 586,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: inputLabel,
                                                        children: "Cost / Buying Price (KES)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 596,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: inputWithPrefix,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: prefixStyle,
                                                                children: "KES"
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 598,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                style: {
                                                                    ...inputStyle,
                                                                    paddingLeft: 48,
                                                                    fontVariantNumeric: 'tabular-nums'
                                                                },
                                                                type: "number",
                                                                min: 0,
                                                                step: 0.01,
                                                                value: costCents,
                                                                onChange: (e)=>setCostCents(e.target.value),
                                                                placeholder: "Not set"
                                                            }, void 0, false, {
                                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                                lineNumber: 599,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 597,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 595,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 585,
                                        columnNumber: 13
                                    }, this),
                                    liveProfitCents !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            padding: '10px 14px',
                                            background: 'var(--bg-surface-elevated)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: 12,
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            gap: 20,
                                            alignItems: 'center'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "Profit: ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        style: {
                                                            color: liveProfitCents >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                                                        },
                                                        children: formatKes(liveProfitCents)
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 609,
                                                        columnNumber: 31
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 609,
                                                columnNumber: 17
                                            }, this),
                                            liveMarginPct !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "Margin: ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        style: {
                                                            color: liveProfitCents >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                                                        },
                                                        children: [
                                                            liveMarginPct,
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 610,
                                                        columnNumber: 58
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 610,
                                                columnNumber: 44
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 608,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: formGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: inputLabel,
                                                children: "Tax Category"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 615,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$components$2f$Select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                id: `tax-category-${product?.id ?? 'new'}`,
                                                value: taxCategoryId,
                                                onChange: setTaxCategoryId,
                                                options: [
                                                    {
                                                        value: '',
                                                        label: 'None'
                                                    },
                                                    ...taxCategories.map((tc)=>({
                                                            value: tc.id,
                                                            label: `${tc.name} (${(tc.rateBp / 100).toFixed(0)}%)`
                                                        }))
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 616,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 614,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 583,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                                style: fieldset,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                        style: legendStyle,
                                        children: "Classification"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 630,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "form-grid-2col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: inputLabel,
                                                        children: "Category"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 633,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$components$2f$Select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                        id: `category-${product?.id ?? 'new'}`,
                                                        value: categoryId,
                                                        onChange: setCategoryId,
                                                        options: [
                                                            {
                                                                value: '',
                                                                label: 'Uncategorized'
                                                            },
                                                            ...categories.map((c)=>({
                                                                    value: c.id,
                                                                    label: c.name
                                                                }))
                                                        ]
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 634,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 632,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: formGroup,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        style: inputLabel,
                                                        children: "Unit Type"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 645,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$components$2f$Select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                                                        id: `unit-type-${product?.id ?? 'new'}`,
                                                        value: unitType,
                                                        onChange: setUnitType,
                                                        options: [
                                                            'each',
                                                            'kg',
                                                            'g',
                                                            'litre',
                                                            'ml',
                                                            'dozen',
                                                            'pack',
                                                            'box'
                                                        ].map((u)=>({
                                                                value: u,
                                                                label: u
                                                            }))
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 646,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 644,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 631,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            gap: 24
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: checkboxLabel,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        checked: isWeighed,
                                                        onChange: (e)=>setIsWeighed(e.target.checked),
                                                        style: {
                                                            width: 16,
                                                            height: 16,
                                                            accentColor: 'var(--accent-primary)'
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 656,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Weighed item (scale required at POS)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 658,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 655,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: checkboxLabel,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        checked: active,
                                                        onChange: (e)=>setActive(e.target.checked),
                                                        style: {
                                                            width: 16,
                                                            height: 16,
                                                            accentColor: 'var(--accent-primary)'
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 661,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Active (visible on register)"
                                                    }, void 0, false, {
                                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                        lineNumber: 663,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 660,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 654,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 629,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                                style: fieldset,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                        style: legendStyle,
                                        children: "Inventory"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 670,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: formGroup,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: inputLabel,
                                                children: "Reorder Point (units)"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 672,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                style: {
                                                    ...inputStyle,
                                                    width: 160
                                                },
                                                type: "number",
                                                min: 0,
                                                step: 1,
                                                value: reorderPoint,
                                                onChange: (e)=>setReorderPoint(e.target.value),
                                                placeholder: "e.g. 10"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 673,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: 11,
                                                    color: 'var(--text-muted)',
                                                    marginTop: 4
                                                },
                                                children: "Alert when stock falls to or below this quantity"
                                            }, void 0, false, {
                                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                                lineNumber: 675,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 671,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 669,
                                columnNumber: 11
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                role: "alert",
                                style: {
                                    padding: '10px 14px',
                                    background: 'var(--accent-rose-bg)',
                                    border: '1px solid rgba(224,109,115,0.3)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--accent-rose)',
                                    fontSize: 13
                                },
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 683,
                                columnNumber: 13
                            }, this),
                            success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                "aria-live": "polite",
                                style: {
                                    padding: '10px 14px',
                                    background: 'var(--accent-emerald-bg)',
                                    border: '1px solid rgba(95,173,124,0.3)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--accent-emerald)',
                                    fontSize: 13
                                },
                                children: isCreate ? 'Product created successfully — closing…' : 'Product saved — closing…'
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 688,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 500,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '16px 24px',
                            borderTop: '1px solid var(--border-subtle)',
                            display: 'flex',
                            gap: 10,
                            justifyContent: 'flex-end',
                            position: 'sticky',
                            bottom: 0,
                            background: 'var(--bg-surface)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                style: secondaryBtn,
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 700,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSave,
                                disabled: saving,
                                style: {
                                    padding: '9px 20px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: saving ? 'var(--bg-surface-subtle)' : 'var(--accent-primary)',
                                    color: saving ? 'var(--text-muted)' : '#fff',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    border: 'none',
                                    transition: 'background 0.15s'
                                },
                                children: saving ? isCreate ? 'Creating…' : 'Saving…' : isCreate ? 'Create Product' : 'Save Changes'
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 701,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 695,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 452,
                columnNumber: 7
            }, this),
            confirmRemove && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$dashboard$2f$components$2f$ConfirmDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConfirmDialog"], {
                title: "Remove Image",
                message: `Remove the image from ${product.name}? The file is deleted from storage and this cannot be undone.`,
                confirmLabel: "Remove Image",
                loading: removing,
                error: imgError,
                onCancel: ()=>{
                    if (!removing) setConfirmRemove(false);
                },
                onConfirm: async ()=>{
                    const ok = await handleRemoveImage();
                    if (ok) setConfirmRemove(false);
                }
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 714,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
        lineNumber: 440,
        columnNumber: 5
    }, this);
}
_s1(EditPanel, "hIIOQTtUe8e31PDlO97M7/VAkhk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = EditPanel;
/* ─── Style helpers ───────────────────────────────────────────────────────── */ const sectionLabel = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 10
};
const fieldset = {
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14
};
const legendStyle = {
    padding: '0 8px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
};
const formGroup = {
    display: 'flex',
    flexDirection: 'column',
    gap: 5
};
const inputLabel = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)'
};
const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface-subtle)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.15s'
};
const inputWithPrefix = {
    position: 'relative'
};
const prefixStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    pointerEvents: 'none'
};
const secondaryBtn = {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface-subtle)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer'
};
const dangerBtn = {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-rose-bg)',
    border: '1px solid rgba(224,109,115,0.25)',
    color: 'var(--accent-rose)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer'
};
const checkboxLabel = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-secondary)',
    cursor: 'pointer'
};
function ProductsGrid({ products, categories, taxCategories }) {
    _s2();
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isCreating, setIsCreating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [filterActive, setFilterActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    // Local mirror of the server list so saves apply optimistically and the
    // panel always sees live data. Reconciled whenever fresh props arrive.
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(products);
    const [highlightId, setHighlightId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductsGrid.useEffect": ()=>{
            setItems(products);
        }
    }["ProductsGrid.useEffect"], [
        products
    ]);
    function handleSaved(saved, isNew) {
        if (isNew) {
            setItems((prev)=>[
                    saved,
                    ...prev.filter((p)=>p.id !== saved.id)
                ]);
        } else {
            setItems((prev)=>prev.map((p)=>p.id === saved.id ? saved : p));
        }
        setHighlightId(saved.id);
        setTimeout(()=>{
            setHighlightId((cur)=>cur === saved.id ? null : cur);
        }, 1800);
    }
    const filtered = items.filter((p)=>{
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.barcode ?? '').includes(search);
        const matchActive = filterActive === 'all' || (filterActive === 'active' ? p.active : !p.active);
        return matchSearch && matchActive;
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 20
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsCreating(true),
                        style: {
                            padding: '9px 18px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 2px 6px rgba(217,119,87,0.25)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "15",
                                height: "15",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2.5",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "12",
                                        y1: "5",
                                        x2: "12",
                                        y2: "19"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 836,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "5",
                                        y1: "12",
                                        x2: "19",
                                        y2: "12"
                                    }, void 0, false, {
                                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                        lineNumber: 837,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 835,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "New Product"
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 839,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 818,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: 'relative',
                            flex: '1 1 240px',
                            maxWidth: 340
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    pointerEvents: 'none',
                                    display: 'inline-flex',
                                    lineHeight: 0
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "14",
                                    height: "14",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    "aria-hidden": "true",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                            cx: "11",
                                            cy: "11",
                                            r: "8"
                                        }, void 0, false, {
                                            fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                            lineNumber: 845,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "m21 21-4.3-4.3"
                                        }, void 0, false, {
                                            fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                            lineNumber: 846,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                    lineNumber: 844,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 843,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "search",
                                placeholder: "Search by name, SKU or barcode…",
                                value: search,
                                onChange: (e)=>setSearch(e.target.value),
                                style: {
                                    width: '100%',
                                    padding: '9px 12px 9px 36px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: 13,
                                    outline: 'none'
                                }
                            }, void 0, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 849,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 842,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 6
                        },
                        children: [
                            'all',
                            'active',
                            'inactive'
                        ].map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setFilterActive(v),
                                className: "filter-pill",
                                style: {
                                    padding: '7px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 12,
                                    fontWeight: filterActive === v ? 700 : 500,
                                    cursor: 'pointer',
                                    background: filterActive === v ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                    color: filterActive === v ? '#fff' : 'var(--text-secondary)',
                                    border: filterActive === v ? 'none' : '1px solid var(--border-subtle)',
                                    transition: 'all 0.15s'
                                },
                                children: v.charAt(0).toUpperCase() + v.slice(1)
                            }, v, false, {
                                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                                lineNumber: 864,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 862,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            marginLeft: 'auto'
                        },
                        children: [
                            filtered.length,
                            " of ",
                            items.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 876,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 817,
                columnNumber: 7
            }, this),
            filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-muted)',
                    fontSize: 13
                },
                children: search ? `No products matching "${search}"` : 'No products found'
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 883,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "products-grid",
                children: filtered.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProductCard, {
                        product: p,
                        highlighted: p.id === highlightId,
                        onEdit: ()=>setEditing(p)
                    }, p.id, false, {
                        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                        lineNumber: 889,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 887,
                columnNumber: 9
            }, this),
            editing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EditPanel, {
                product: items.find((p)=>p.id === editing.id) ?? editing,
                categories: categories,
                taxCategories: taxCategories,
                onClose: ()=>setEditing(null),
                onSaved: handleSaved
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 901,
                columnNumber: 9
            }, this),
            isCreating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EditPanel, {
                product: null,
                categories: categories,
                taxCategories: taxCategories,
                onClose: ()=>setIsCreating(false),
                onSaved: handleSaved
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 912,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        input:focus, textarea:focus, select:focus { border-color: var(--border-focus) !important; }
      `
            }, void 0, false, {
                fileName: "[project]/dashboard/components/ProductsGrid.tsx",
                lineNumber: 921,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashboard/components/ProductsGrid.tsx",
        lineNumber: 815,
        columnNumber: 5
    }, this);
}
_s2(ProductsGrid, "hvHNfd17a/LmuAMq1NhpDtnz2co=");
_c2 = ProductsGrid;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "ProductCard");
__turbopack_context__.k.register(_c1, "EditPanel");
__turbopack_context__.k.register(_c2, "ProductsGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/dashboard/components/Select.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Select",
    ()=>Select
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const MENU_MAX_HEIGHT = 240;
function Select({ id, value, onChange, options }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [openUpward, setOpenUpward] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const rootRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "Select.useLayoutEffect": ()=>{
            if (!open || !rootRef.current) return;
            const updatePlacement = {
                "Select.useLayoutEffect.updatePlacement": ()=>{
                    if (!rootRef.current) return;
                    const rect = rootRef.current.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    // Prefer below; flip only if there isn't enough room below but there is above.
                    setOpenUpward(spaceBelow < MENU_MAX_HEIGHT + 12 && spaceAbove > spaceBelow);
                }
            }["Select.useLayoutEffect.updatePlacement"];
            updatePlacement();
            window.addEventListener('resize', updatePlacement);
            window.addEventListener('scroll', updatePlacement, true);
            return ({
                "Select.useLayoutEffect": ()=>{
                    window.removeEventListener('resize', updatePlacement);
                    window.removeEventListener('scroll', updatePlacement, true);
                }
            })["Select.useLayoutEffect"];
        }
    }["Select.useLayoutEffect"], [
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Select.useEffect": ()=>{
            function handleClickOutside(e) {
                if (rootRef.current && !rootRef.current.contains(e.target)) {
                    setOpen(false);
                }
            }
            function handleEscape(e) {
                if (e.key === 'Escape') setOpen(false);
            }
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            return ({
                "Select.useEffect": ()=>{
                    document.removeEventListener('mousedown', handleClickOutside);
                    document.removeEventListener('keydown', handleEscape);
                }
            })["Select.useEffect"];
        }
    }["Select.useEffect"], []);
    const selected = options.find((o)=>o.value === value);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "custom-select",
        ref: rootRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                id: id,
                className: `custom-select-trigger${open ? ' open' : ''}`,
                "aria-haspopup": "listbox",
                "aria-expanded": open,
                onClick: ()=>setOpen((o)=>!o),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: selected?.label ?? ''
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/Select.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "custom-select-chevron",
                        width: "12",
                        height: "12",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            d: "m6 9 6 6 6-6"
                        }, void 0, false, {
                            fileName: "[project]/dashboard/components/Select.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/dashboard/components/Select.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/dashboard/components/Select.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: `custom-select-menu${openUpward ? ' upward' : ''}`,
                role: "listbox",
                tabIndex: -1,
                children: options.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        role: "option",
                        "aria-selected": option.value === value,
                        className: `custom-select-option${option.value === value ? ' selected' : ''}`,
                        onClick: ()=>{
                            onChange(option.value);
                            setOpen(false);
                        },
                        children: option.label
                    }, option.value, false, {
                        fileName: "[project]/dashboard/components/Select.tsx",
                        lineNumber: 96,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/dashboard/components/Select.tsx",
                lineNumber: 90,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/dashboard/components/Select.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
_s(Select, "W+gfHvGxex45SQY6ngAmKV1tBys=");
_c = Select;
var _c;
__turbopack_context__.k.register(_c, "Select");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=dashboard_components_1takwti._.js.map