import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MapPin } from "lucide-react";

import img1 from "@/assets/1.png";
import img2 from "@/assets/2.png";
import img3 from "@/assets/3.png";
import img4 from "@/assets/4.png";
import img5 from "@/assets/5.png";
import img6 from "@/assets/6.png";
import img7 from "@/assets/7.png";
import img8 from "@/assets/8.png";

gsap.registerPlugin(ScrollTrigger);

export function ScrollyMonza() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        start: "top top",
        end: "+=300%",
        scrub: true,
      },
    });

    // The entire animation duration is arbitrarily set to 7 so we can easily map the 7 crossfades.
    // The text block remains fixed in size.


    // Crossfade the images sequentially
    tl.to(".monza-img-2", { opacity: 1, duration: 1, ease: "none" }, 0);
    tl.to(".monza-img-3", { opacity: 1, duration: 1, ease: "none" }, 1);
    tl.to(".monza-img-4", { opacity: 1, duration: 1, ease: "none" }, 2);
    tl.to(".monza-img-5", { opacity: 1, duration: 1, ease: "none" }, 3);
    tl.to(".monza-img-6", { opacity: 1, duration: 1, ease: "none" }, 4);
    tl.to(".monza-img-7", { opacity: 1, duration: 1, ease: "none" }, 5);
    tl.to(".monza-img-8", { opacity: 1, duration: 1, ease: "none" }, 6);
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="scrolly-monza relative h-screen w-full overflow-hidden bg-black">
      <img src={img1} alt="Monza 1" className="monza-img-1 absolute inset-0 h-full w-full object-cover" />
      <img src={img2} alt="Monza 2" className="monza-img-2 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img3} alt="Monza 3" className="monza-img-3 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img4} alt="Monza 4" className="monza-img-4 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img5} alt="Monza 5" className="monza-img-5 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img6} alt="Monza 6" className="monza-img-6 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img7} alt="Monza 7" className="monza-img-7 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img8} alt="Monza 8" className="monza-img-8 absolute inset-0 h-full w-full object-cover opacity-0" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
        <div ref={textWrapperRef} className="relative flex flex-col items-center justify-center w-full h-full">
          <h2 className="monza-text text-[20vw] font-display font-bold uppercase text-white leading-none tracking-tighter">
            MONZA
          </h2>
          
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 text-white/90 font-mono text-sm sm:text-lg tracking-widest">
            45.6205° N, 9.2816° E
          </div>
          
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 text-white/90 font-mono text-sm sm:text-lg tracking-widest flex items-center gap-2 uppercase">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            ITALY
          </div>
        </div>
      </div>
    </section>
  );
}
