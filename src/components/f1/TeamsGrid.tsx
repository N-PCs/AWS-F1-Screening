import React from "react";

export type TeamDriver = {
  firstName: string;
  lastName: string;
  avatar: string;
};

export type TeamData = {
  id: string;
  name: string;
  logo: string;
  car: string;
  bgGradient: string;
  drivers: TeamDriver[];
};

export const teamsData: TeamData[] = [
  {
    id: "mercedes",
    name: "Mercedes",
    logo: "/carlogo/mercedeslogo.avif",
    car: "/car/mercedes.avif",
    bgGradient: "bg-gradient-to-br from-[#00b295] via-[#008f77] to-[#006b59]",
    drivers: [
      { firstName: "George", lastName: "RUSSELL", avatar: "/drivers/georgerussell.avif" },
      { firstName: "Kimi", lastName: "ANTONELLI", avatar: "/drivers/kimiantonelli.avif" },
    ],
  },
  {
    id: "ferrari",
    name: "Ferrari",
    logo: "/carlogo/ferrarilogo.avif",
    car: "/car/ferrari.avif",
    bgGradient: "bg-gradient-to-br from-[#ce0000] via-[#a30000] to-[#7a0000]",
    drivers: [
      { firstName: "Charles", lastName: "LECLERC", avatar: "/drivers/charlesleclerc.avif" },
      { firstName: "Lewis", lastName: "HAMILTON", avatar: "/drivers/lewishamilton.avif" },
    ],
  },
  {
    id: "mclaren",
    name: "McLaren",
    logo: "/carlogo/mclarenlogo.avif",
    car: "/car/maclaren.avif",
    bgGradient: "bg-gradient-to-br from-[#d96b00] via-[#b35400] to-[#8c3e00]",
    drivers: [
      { firstName: "Lando", lastName: "NORRIS", avatar: "/drivers/landonorris.avif" },
      { firstName: "Oscar", lastName: "PIASTRI", avatar: "/drivers/oscarpiastri.avif" },
    ],
  },
  {
    id: "redbull",
    name: "Red Bull Racing",
    logo: "/carlogo/redbullracinglogo.avif",
    car: "/car/redbull.avif",
    bgGradient: "bg-gradient-to-br from-[#122244] via-[#0c1833] to-[#070e20]",
    drivers: [
      { firstName: "Max", lastName: "VERSTAPPEN", avatar: "/drivers/maxversteppen.avif" },
      { firstName: "Isack", lastName: "HADJAR", avatar: "/drivers/isackhadjar.avif" },
    ],
  },
  {
    id: "racingbulls",
    name: "Racing Bulls",
    logo: "/carlogo/racingbull.avif",
    car: "/car/racingbull.avif",
    bgGradient: "bg-gradient-to-br from-[#1a5ce6] via-[#1245b8] to-[#0b2f8a]",
    drivers: [
      { firstName: "Liam", lastName: "LAWSON", avatar: "/drivers/liamlawson.avif" },
      { firstName: "Arvid", lastName: "LINDBLAD", avatar: "/drivers/arvidlindblad.avif" },
    ],
  },
  {
    id: "alpine",
    name: "Alpine",
    logo: "/carlogo/alpinelogo.avif",
    car: "/car/alpine.avif",
    bgGradient: "bg-gradient-to-br from-[#008ecb] via-[#006fa0] to-[#004f73]",
    drivers: [
      { firstName: "Pierre", lastName: "GASLY", avatar: "/drivers/piergasly.avif" },
      { firstName: "Franco", lastName: "COLAPINTO", avatar: "/drivers/francocolapinto.avif" },
    ],
  },
  {
    id: "haas",
    name: "Haas F1 Team",
    logo: "/carlogo/haasf1logo.avif",
    car: "/car/haasf1.avif",
    bgGradient: "bg-gradient-to-br from-[#4a4d52] via-[#35383c] to-[#202224]",
    drivers: [
      { firstName: "Esteban", lastName: "OCON", avatar: "/drivers/estebaanocon.avif" },
      { firstName: "Oliver", lastName: "BEARMAN", avatar: "/drivers/oliverbearman.avif" },
    ],
  },
  {
    id: "audi",
    name: "Audi",
    logo: "/carlogo/audilogo.avif",
    car: "/car/audi.avif",
    bgGradient: "bg-gradient-to-br from-[#b81414] via-[#8c0e0e] to-[#600808]",
    drivers: [
      { firstName: "Nico", lastName: "HÜLKENBERG", avatar: "/drivers/nicohulkenburg.avif" },
      { firstName: "Gabriel", lastName: "BORTOLETO", avatar: "/drivers/gabrielbortoleto.avif" },
    ],
  },
  {
    id: "williams",
    name: "Williams",
    logo: "/carlogo/williamslogo.avif",
    car: "/car/williams.avif",
    bgGradient: "bg-gradient-to-br from-[#0038a8] via-[#002778] to-[#001748]",
    drivers: [
      { firstName: "Carlos", lastName: "SAINZ", avatar: "/drivers/carlossainz.avif" },
      { firstName: "Alexander", lastName: "ALBON", avatar: "/drivers/alexanderalbon.avif" },
    ],
  },
  {
    id: "astonmartin",
    name: "Aston Martin",
    logo: "/carlogo/astonmartinlogo.avif",
    car: "/car/astonmartin.avif",
    bgGradient: "bg-gradient-to-br from-[#00665e] via-[#004d47] to-[#00332e]",
    drivers: [
      { firstName: "Fernando", lastName: "ALONSO", avatar: "/drivers/fernandoalonso.avif" },
      { firstName: "Lance", lastName: "STROLL", avatar: "/drivers/lancestroll.avif" },
    ],
  },
  {
    id: "cadillac",
    name: "Cadillac",
    logo: "/carlogo/cadillaclogo.avif",
    car: "/car/cadillac.avif",
    bgGradient: "bg-gradient-to-br from-[#525459] via-[#383a3d] to-[#212224]",
    drivers: [
      { firstName: "Sergio", lastName: "PÉREZ", avatar: "/drivers/sergioperez.avif" },
      { firstName: "Valtteri", lastName: "BOTTAS", avatar: "/drivers/valterribottas.avif" },
    ],
  },
];

export const TeamsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
      {teamsData.map((team) => (
        <div
          key={team.id}
          className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-[210px] sm:min-h-[235px] border border-white/10 shadow-lg ${team.bgGradient} group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/25`}
        >
          {/* Subtle dotted mesh texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"
            aria-hidden="true"
          />

          {/* Card Header: Team Title, Driver Badges & Team Logo */}
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-none select-none">
                {team.name}
              </h3>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {team.drivers.map((d) => (
                  <div
                    key={d.lastName}
                    className="flex items-center gap-1.5 bg-black/25 backdrop-blur-sm pl-1 pr-2.5 py-0.5 rounded-full border border-white/20 text-xs text-white/95 shadow-sm"
                  >
                    {/* Driver Avatar: Only upper half of image shown (head & torso) */}
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/60 bg-black/40 shrink-0 flex items-start justify-center">
                      <img
                        src={d.avatar}
                        alt={`${d.firstName} ${d.lastName}`}
                        className="w-full h-full object-cover object-top scale-140 origin-top"
                        loading="lazy"
                      />
                    </div>
                    <span className="select-none">
                      <span className="font-normal text-white/80 mr-1">{d.firstName}</span>
                      <span className="font-extrabold text-white tracking-wide">{d.lastName}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Logo Badge */}
            <div className="w-10 h-10 rounded-full bg-black/35 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={team.logo}
                alt={`${team.name} logo`}
                className="w-full h-full object-contain filter drop-shadow"
                loading="lazy"
              />
            </div>
          </div>

          {/* Car Image Display */}
          <div className="relative z-10 mt-4 sm:mt-6 flex justify-center items-end">
            <img
              src={team.car}
              alt={`${team.name} F1 car`}
              className="w-[92%] sm:w-[88%] max-h-[125px] sm:max-h-[145px] object-contain drop-shadow-[0_12px_15px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
