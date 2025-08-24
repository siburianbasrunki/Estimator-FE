import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEstimation } from "../../hooks/useEstimation";
import { formatDateTimeID } from "../../helper/date";
import { formatIDR } from "../../helper/rupiah";
import EstimationService from "../../service/estimation";
import toast from "react-hot-toast";
import { BackButton } from "../../components/BackButton";

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

export const DetailEstimation: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    data: estimation,
    isLoading,
    isError,
    error,
  } = useEstimation(id || "");
  // const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

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
  // const handleExportPdf = async () => {
  //   if (!id || !estimation) return;
  //   try {
  //     setDownloadingPdf(true);
  //     await EstimationService.downloadPdf(id, estimation.projectName);
  //     toast.success("Export PDF berhasil");
  //   } catch (e: any) {
  //     toast.error(e?.message || "Gagal export PDF");
  //   } finally {
  //     setDownloadingPdf(false);
  //   }
  // };

  const handleExportExcel = async () => {
    if (!id || !estimation) return;
    try {
      setDownloadingExcel(true);
      await EstimationService.downloadExcel(id, estimation.projectName);
      toast.success("Export Excel berhasil");
    } catch (e: any) {
      toast.error(e?.message || "Gagal export Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };
  if (isLoading) {
    return (
      <div className="max-w mx-auto p-4 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
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
    <div className="max-w mx-auto p-4 space-y-6 text-black">
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
              disabled={downloadingExcel}
              aria-busy={downloadingExcel}
            >
              {downloadingExcel ? "Mempersiapkan Excel..." : "Export Excel"}
            </button>
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
                        {section.details.map((d) => {
                          const total =
                            typeof d.hargaTotal === "number"
                              ? d.hargaTotal
                              : d.hargaSatuan * d.volume;
                          return (
                            <tr key={d.id}>
                              <td>{section.details.indexOf(d) + 1}</td>
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
                          <td className="text-right font-bold text-black">
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
    </div>
  );
};

export default DetailEstimation;
