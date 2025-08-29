// src/pages/estimation/DetailEstimation.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEstimation } from "../../hooks/useEstimation";
import { formatDateTimeID } from "../../helper/date";
import { formatIDR } from "../../helper/rupiah";
import EstimationService from "../../service/estimation";
import { BackButton } from "../../components/BackButton";
import Skeleton from "../../components/Skeleton";
import { useNotify } from "../../components/Notify/notify";
import PdfService from "../../service/pdfDownload";

/* =========================
   Kartu field kecil reusable
   ========================= */
const FieldCard = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="card bg-white border border-gray-200 shadow-sm">
    <div className="card-body p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-medium text-black break-words">{value ?? "-"}</div>
    </div>
  </div>
);

/* =========================
   Skeleton untuk halaman detail
   ========================= */
const DetailSkeleton: React.FC = () => {
  return (
    <div className="max-w mx-auto p-4 space-y-6 text-black">
      {/* Back button + title area */}
      <div className="flex items-center gap-3">
        <Skeleton.Line width="w-24" height="h-9" className="rounded-lg" />
        <Skeleton.Line width="w-48" height="h-6" />
      </div>

      {/* Header card */}
      <div className="card bg-white border border-gray-200 shadow-sm">
        <div className="card-body gap-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-3">
            <div className="space-y-2">
              <Skeleton.Line width="w-72" height="h-8" />
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton.Line width="w-24" height="h-4" />
                <Skeleton.Line width="w-24" height="h-4" />
                <Skeleton.Line width="w-16" height="h-4" />
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <Skeleton.Line width="w-40" height="h-4" />
              <Skeleton.Line width="w-44" height="h-4" />
              <Skeleton.Line width="w-56" height="h-4" />
            </div>
          </div>

          {/* Notes */}
          <Skeleton.Line width="w-32" height="h-4" />
          <Skeleton.Line width="w-full" height="h-12" />

          {/* Stats */}
          <div className="stats stats-vertical sm:stats-horizontal shadow mt-2 bg-white border border-gray-200">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat">
                <Skeleton.Line width="w-24" height="h-4" className="mb-2" />
                <Skeleton.Line width="w-20" height="h-6" />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Skeleton.Line width="w-40" height="h-10" className="rounded-lg" />
            <Skeleton.Line width="w-40" height="h-10" className="rounded-lg" />
          </div>
        </div>
      </div>

      {/* Custom fields */}
      <div className="space-y-2">
        <Skeleton.Line width="w-48" height="h-5" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card bg-white border border-gray-200 shadow-sm"
            >
              <div className="card-body p-4">
                <Skeleton.Line width="w-24" height="h-3" className="mb-2" />
                <Skeleton.Line width="w-40" height="h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections + tables */}
      <div className="space-y-3">
        <Skeleton.Line width="w-56" height="h-5" />
        {Array.from({ length: 2 }).map((_, box) => (
          <div
            key={box}
            className="card bg-white border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="collapse collapse-arrow">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title flex justify-between items-center bg-gray-200">
                <Skeleton.Line width="w-64" height="h-5" />
                <Skeleton.Line
                  width="w-24"
                  height="h-6"
                  className="rounded-full"
                />
              </div>
              <div className="collapse-content">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="text-black">
                      <tr>
                        {[
                          "No",
                          "Deskripsi",
                          "Kode",
                          "Volume",
                          "Satuan",
                          "Harga Satuan",
                          "Harga Total",
                        ].map((i) => (
                          <th key={i}>
                            <Skeleton.Line width="w-20" height="h-4" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 4 }).map((__, r) => (
                        <tr key={r}>
                          <td>
                            <Skeleton.Line width="w-6" height="h-4" />
                          </td>
                          <td>
                            <Skeleton.Line width="w-64" height="h-4" />
                          </td>
                          <td>
                            <Skeleton.Line width="w-20" height="h-4" />
                          </td>
                          <td className="text-right">
                            <Skeleton.Line width="w-12" height="h-4" />
                          </td>
                          <td>
                            <Skeleton.Line width="w-16" height="h-4" />
                          </td>
                          <td className="text-right">
                            <Skeleton.Line width="w-24" height="h-4" />
                          </td>
                          <td className="text-right">
                            <Skeleton.Line width="w-24" height="h-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4}></td>
                        <td className="text-right">
                          <Skeleton.Line width="w-20" height="h-4" />
                        </td>
                        <td className="text-right" colSpan={2}>
                          <Skeleton.Line width="w-28" height="h-5" />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================
   Halaman utama
   ========================= */
export const DetailEstimation: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    data: estimation,
    isLoading,
    isError,
    error,
  } = useEstimation(id || "");
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const notify = useNotify();
  // Modal & file logo (dipakai untuk keduanya: Excel & PDF)
  const [showLogoModal, setShowLogoModal] = useState<
    false | "excel" | "pdf-rab"
  >(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const onPickLogo: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setLogoError(null);
    const f = e.target.files?.[0] || null;
    if (!f) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!/^image\/(png|jpe?g)$/i.test(f.type)) {
      setLogoError("Format harus PNG atau JPG.");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setLogoError("Ukuran maksimal 2 MB.");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const doExport = async (kind: "excel" | "pdf-rab", withLogo: boolean) => {
    if (!id || !estimation) return;
    try {
      if (kind === "excel") {
        setDownloadingExcel(true);
        await EstimationService.downloadExcel(
          id,
          estimation.projectName,
          withLogo ? logoFile : null
        );
        notify("Export Excel berhasil", "success");
      } else {
        setDownloadingPdf(true);
        await PdfService.downloadPdfRAB(
          id,
          estimation.projectName,
          withLogo ? logoFile : null
        );
        notify("Export PDF RAB berhasil", "success");
      }
    } catch (e: any) {
      notify(
        e?.message || `Gagal export ${kind === "excel" ? "Excel" : "PDF RAB"}`,
        "error"
      );
    } finally {
      setDownloadingExcel(false);
      setDownloadingPdf(false);
      setShowLogoModal(false);
      setLogoFile(null);
      setLogoPreview(null);
      setLogoError(null);
    }
  };

  const handleExportExcel = () => setShowLogoModal("excel");
  const handleExportPdfRAB = () => setShowLogoModal("pdf-rab");
  const handlePdfPick = async (
    type: "volume" | "jobitem" | "kategori" | "ahsp" | "masteritem"
  ) => {
    if (!id || !estimation) return;
    try {
      setDownloadingPdf(true);
      if (type === "volume") {
        await PdfService.downloadPdfVolume(id, estimation.projectName);
      } else if (type === "jobitem") {
        await PdfService.downloadPdfJobItem(id, estimation.projectName);
      } else if (type === "kategori") {
        await PdfService.downloadPdfKategori(id, estimation.projectName);
      } else if (type === "ahsp") {
        await PdfService.downloadPdfAHSP(id, estimation.projectName);
      } else if (type === "masteritem") {
        await PdfService.downloadPdfMasterItem(id, estimation.projectName);
      }
      notify("Export PDF berhasil", "success");
    } catch (e: any) {
      notify(e?.message || "Gagal export PDF", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };
  const { subtotal, ppnAmount, grandTotal, itemCount } = useMemo(() => {
    const items = estimation?.items ?? [];
    const sub = items.reduce((sum, it) => {
      return (
        sum +
        it.details.reduce(
          (s, d) =>
            s +
            (typeof d.hargaTotal === "number"
              ? d.hargaTotal
              : d.hargaSatuan * d.volume),
          0
        )
      );
    }, 0);
    const ppnPct = estimation?.ppn ?? 0;
    const ppn = Math.round(sub * (ppnPct / 100));
    const grand = sub + ppn;
    const count = items.reduce((acc, it) => acc + it.details.length, 0);
    return {
      subtotal: sub,
      ppnAmount: ppn,
      grandTotal: grand,
      itemCount: count,
    };
  }, [estimation]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div role="alert" className="alert alert-error text-black">
          <span className="font-semibold">Gagal memuat data.</span>
          <span>
            {(error as any)?.message || "Terjadi kesalahan tak terduga."}
          </span>
        </div>
      </div>
    );
  }

  if (!estimation) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div
          role="alert"
          className="alert bg-gray-100 border border-gray-300 text-black"
        >
          <span>Data estimasi tidak ditemukan.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w mx-auto space-y-6 text-black">
      <BackButton onClick={() => navigate("/estimation")} title="Kembali" />

      {/* Header */}
      <div className="card bg-white border border-gray-200 shadow-sm">
        <div className="card-body gap-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {estimation.projectName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <div className="hidden md:block w-px h-4 bg-gray-300" />
                <span>
                  Owner:{" "}
                  <span className="font-medium">{estimation.projectOwner}</span>
                </span>
                <div className="hidden md:block w-px h-4 bg-gray-300" />
                <span>
                  PPN: <span className="font-medium">{estimation.ppn}%</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1 text-sm">
              <span>
                Dibuat:{" "}
                <span className="font-medium">
                  {formatDateTimeID(estimation.createdAt)}
                </span>
              </span>
              <span>
                Diperbarui:{" "}
                <span className="font-medium">
                  {formatDateTimeID(estimation.updatedAt)}
                </span>
              </span>
              <span>
                Author:{" "}
                <span className="font-medium">{estimation.author?.name}</span>
                {estimation.author?.email && ` (${estimation.author.email})`}
              </span>
            </div>
          </div>

          {estimation.notes && (
            <div className="mt-2">
              <span className="font-semibold">Keterangan: </span>
              <span className="whitespace-pre-wrap">{estimation.notes}</span>
            </div>
          )}

          <div className="stats stats-vertical sm:stats-horizontal shadow mt-2 bg-white border border-gray-200">
            <div className="stat">
              <div className="stat-title text-gray-500">Jumlah Item</div>
              <div className="stat-value text-xl">{itemCount}</div>
            </div>
            <div className="stat">
              <div className="stat-title text-gray-500">Subtotal</div>
              <div className="stat-value text-xl">{formatIDR(subtotal)}</div>
            </div>
            <div className="stat">
              <div className="stat-title text-gray-500">
                PPN ({estimation.ppn}%)
              </div>
              <div className="stat-value text-xl">{formatIDR(ppnAmount)}</div>
            </div>
            <div className="stat">
              <div className="stat-title text-gray-500">Grand Total</div>
              <div className="stat-value text-xl">{formatIDR(grandTotal)}</div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="btn bg-blue-400 hover:bg-blue-500 "
              onClick={() => navigate(`/estimation/update/${id}`)}
            >
              Update Estimation
            </button>

            <button
              type="button"
              className={`btn btn-success ${downloadingExcel ? "loading" : ""}`}
              onClick={handleExportExcel}
              // disabled={downloadingExcel || downloadingPdf}
              aria-busy={downloadingExcel}
            >
              {downloadingExcel ? "Mempersiapkan Excel..." : "Export Excel"}
            </button>

            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className={`btn btn-outline ${downloadingPdf ? "loading" : ""}`}
                aria-busy={downloadingPdf}
              >
                {downloadingPdf ? "Mempersiapkan PDF..." : "Export PDF"}
                <svg
                  className="ml-2 h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5.25 7.5l4.5 4.5 4.5-4.5h-9z" />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-white border border-gray-200 rounded-box w-56"
              >
                <li>
                  <button
                    onClick={handleExportPdfRAB}
                    // disabled={downloadingPdf}
                  >
                    PDF RAB (dengan/ tanpa logo)
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handlePdfPick("volume")}
                    // disabled={downloadingPdf}
                  >
                    Volume
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handlePdfPick("jobitem")}
                    // disabled={downloadingPdf}
                  >
                    Job Item Dipakai
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handlePdfPick("kategori")}
                    // disabled={downloadingPdf}
                  >
                    Kategori Dipakai
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handlePdfPick("ahsp")}
                    // disabled={downloadingPdf}
                  >
                    AHSP Dipakai
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handlePdfPick("masteritem")}
                    // disabled={downloadingPdf}
                  >
                    Master Item Dipakai
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {estimation.customFields?.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Informasi Tambahan</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {estimation.customFields.map((cf) => (
              <FieldCard key={cf.id} label={cf.label} value={cf.value} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Rincian Pekerjaan</h2>
        {(!estimation.items || estimation.items.length === 0) && (
          <div className="alert bg-gray-100 border border-gray-300">
            <span>Belum ada rincian pekerjaan.</span>
          </div>
        )}
        {estimation.items?.map((section) => {
          const sectionSubtotal = section.details.reduce(
            (s, d) =>
              s +
              (typeof d.hargaTotal === "number"
                ? d.hargaTotal
                : d.hargaSatuan * d.volume),
            0
          );
          return (
            <div
              key={section.id}
              className="card bg-white border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="collapse collapse-arrow">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title font-semibold flex justify-between bg-gray-200">
                  <span>{section.title}</span>
                  <span className="badge border border-gray-300 bg-gray-100 text-black">
                    {formatIDR(sectionSubtotal)}
                  </span>
                </div>
                <div className="collapse-content">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className=" text-black">
                        <tr>
                          <th>No</th>
                          <th>Deskripsi</th>
                          <th>Kode</th>
                          <th className="text-right">Volume</th>
                          <th>Satuan</th>
                          <th className="text-right">Harga Satuan</th>
                          <th className="text-right">Harga Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.details.map((d, idx) => {
                          const total =
                            typeof d.hargaTotal === "number"
                              ? d.hargaTotal
                              : d.hargaSatuan * d.volume;
                          return (
                            <tr key={d.id}>
                              <td>{idx + 1}</td>
                              <td className="whitespace-pre-wrap">
                                {d.deskripsi}
                              </td>
                              <td className="font-medium">{d.kode}</td>
                              <td className="text-right">{d.volume}</td>
                              <td>{d.satuan}</td>
                              <td className="text-right">
                                {formatIDR(d.hargaSatuan)}
                              </td>
                              <td className="text-right">{formatIDR(total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4}></td>
                          <td className="text-right text-black font-semibold">
                            Subtotal
                          </td>
                          <td
                            className="text-right font-bold text-black"
                            colSpan={2}
                          >
                            {formatIDR(sectionSubtotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Export (Excel/PDF) */}
      {showLogoModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white text-black">
            <h3 className="font-bold text-lg mb-2">
              {showLogoModal === "excel"
                ? "Tambah Logo ke Excel?"
                : "Tambah Logo ke PDF RAB?"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              (Opsional) Unggah logo perusahaan Anda (PNG/JPG, maks 2MB).
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={onPickLogo}
              className="file-input file-input-bordered w-full mb-3 text-white"
            />

            {logoError && (
              <div className="alert alert-warning mb-3">
                <span>{logoError}</span>
              </div>
            )}

            {logoPreview && (
              <div className="border border-gray-200 rounded p-2 mb-3 w-fit">
                <div className="text-xs text-gray-500 mb-1">Pratinjau:</div>
                <img
                  src={logoPreview}
                  alt="Preview Logo"
                  className="max-h-24 object-contain"
                />
              </div>
            )}

            <div className="modal-action flex flex-wrap gap-2 justify-start">
              <button
                className="btn btn-soft"
                onClick={() => setShowLogoModal(false)}
                disabled={downloadingExcel || downloadingPdf}
              >
                Batal
              </button>

              <button
                className="btn btn-dash"
                onClick={() => doExport(showLogoModal, false)}
                disabled={downloadingExcel || downloadingPdf}
              >
                {showLogoModal === "excel"
                  ? downloadingExcel
                    ? "Mengunduh..."
                    : "Lanjut tanpa logo"
                  : downloadingPdf
                  ? "Mengunduh..."
                  : "Lanjut tanpa logo"}
              </button>

              <button
                className="btn btn-success"
                onClick={() => doExport(showLogoModal, true)}
                disabled={!logoFile || downloadingExcel || downloadingPdf}
                title={!logoFile ? "Pilih logo dulu (opsional)" : ""}
              >
                {showLogoModal === "excel"
                  ? downloadingExcel
                    ? "Mengunduh..."
                    : "Export dengan logo"
                  : downloadingPdf
                  ? "Mengunduh..."
                  : "Export dengan logo"}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowLogoModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DetailEstimation;
