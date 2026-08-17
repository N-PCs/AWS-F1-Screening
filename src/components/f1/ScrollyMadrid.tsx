import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MapPin } from "lucide-react";

import img2 from "@/assets/1.webp";
import img3 from "@/assets/2.webp";
import img1 from "/random/madring.webp";
import img4 from "@/assets/4.webp";
import img5 from "@/assets/5.webp";
import img6 from "@/assets/6.webp";
import img7 from "@/assets/7.webp";
import img8 from "@/assets/8.webp";

gsap.registerPlugin(ScrollTrigger);

export function ScrollyMadrid() {
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

    // start the MADRID text small and grow it across the whole scroll timeline
    gsap.set(".madring-text", { scale: 0.4, transformOrigin: "50% 50%" });
    tl.to(
      ".madring-text",
      { scale: 1.2, duration: 7, ease: "none" },
      0
    );

    // The entire animation duration is arbitrarily set to 7 so we can easily map the 7 crossfades.
    // The text block remains fixed in size.


    // Crossfade the images sequentially
    tl.to(".madring-img-2", { opacity: 1, duration: 1, ease: "none" }, 0);
    tl.to(".madring-img-3", { opacity: 1, duration: 1, ease: "none" }, 1);
    tl.to(".madring-img-4", { opacity: 1, duration: 1, ease: "none" }, 2);
    tl.to(".madring-img-5", { opacity: 1, duration: 1, ease: "none" }, 3);
    tl.to(".madring-img-6", { opacity: 1, duration: 1, ease: "none" }, 4);
    tl.to(".madring-img-7", { opacity: 1, duration: 1, ease: "none" }, 5);
    tl.to(".madring-img-8", { opacity: 1, duration: 1, ease: "none" }, 6);
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="scrolly-madring relative h-screen w-full overflow-hidden bg-black">
      <img src={img1} alt="Madrid 1" className="madring-img-1 absolute inset-0 h-full w-full object-cover" />
      <img src={img2} alt="Madrid 2" className="madring-img-2 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img3} alt="Madrid 3" className="madring-img-3 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img4} alt="Madrid 4" className="madring-img-4 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img5} alt="Madrid 5" className="madring-img-5 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img6} alt="Madrid 6" className="madring-img-6 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img7} alt="Madrid 7" className="madring-img-7 absolute inset-0 h-full w-full object-cover opacity-0" />
      <img src={img8} alt="Madrid 8" className="madring-img-8 absolute inset-0 h-full w-full object-cover opacity-0" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
        <div ref={textWrapperRef} className="relative flex flex-col items-center justify-center w-full h-full">
          <h2 className="madring-text text-[20vw] font-display font-bold uppercase text-white leading-none tracking-tighter">
            MADRID
          </h2>
          
          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 text-white/90 font-mono text-sm sm:text-lg tracking-widest">
            40.4653° N, 3.6153° W
          </div>
          
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 text-white/90 font-mono text-sm sm:text-lg tracking-widest flex items-center gap-2 uppercase">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            SPAIN
          </div>
        </div>
      </div>
    </section>
  );
}