import { DotGrid } from "./Brand";

/** Dekorasi latar statis: pola titik di sudut, seperti foto produk. */
export function Decor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <DotGrid className="absolute top-40 -right-4 size-28 sm:top-44 sm:right-[6%] sm:size-36" />
      <DotGrid className="absolute bottom-16 -left-6 size-24 sm:bottom-24 sm:left-[5%] sm:size-32" />
    </div>
  );
}
