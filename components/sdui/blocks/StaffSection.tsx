import Image from "next/image";
import type { StaffSectionProps, StaffMemberItem } from "@/types/blocks";
import { mediaUrl, mediaAlt } from "@/lib/media";

function StaffCard({ member }: { member: StaffMemberItem }) {
  const imgUrl = mediaUrl(member.foto);
  const imgAlt = mediaAlt(member.foto, member.nombre);

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 shadow-sm">
      {/* Photo */}
      <div className="relative h-40 w-40 overflow-hidden rounded-full shrink-0 bg-gray-100">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={imgAlt}
            fill
            sizes="160px"
            className="object-cover object-top"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-bold text-white"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
            aria-hidden="true"
          >
            {member.nombre.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <p
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-foues-navy)" }}
        >
          {member.cargo}
        </p>
        <p className="mt-1 text-base font-bold text-gray-800">{member.nombre}</p>
        {member.descripcion && (
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{member.descripcion}</p>
        )}
      </div>
    </div>
  );
}

export default function StaffSection({ titulo, unidad }: StaffSectionProps) {
  if (!unidad || unidad.miembros.length === 0) return null;

  const heading = titulo ?? unidad.nombre;

  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-[1920px] mx-auto px-6">
        {/* Section title */}
        <div className="mb-12">
          <h2
            className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
            style={{ color: "var(--color-foues-navy)" }}
          >
            {heading}
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
            aria-hidden="true"
          />
        </div>

        {/* Staff grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {unidad.miembros.map((member) => (
            <StaffCard key={member.documentId} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
