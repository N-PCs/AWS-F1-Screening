import React from "react";
import { FlagIcon } from "./FlagIcon";

export type DriverData = {
  id: string;
  firstName: string;
  lastName: string;
  team: string;
  number: string;
  country: string;
  image: string;
  bgGradient: string;
};

export const driversData: DriverData[] = [
  {
    id: "russell",
    firstName: "George",
    lastName: "Russell",
    team: "Mercedes",
    number: "63",
    country: "GB",
    image: "/drivers/georgerussell.avif",
    bgGradient: "bg-gradient-to-br from-[#00b295] via-[#008f77] to-[#006b59]",
  },
  {
    id: "antonelli",
    firstName: "Kimi",
    lastName: "Antonelli",
    team: "Mercedes",
    number: "12",
    country: "IT",
    image: "/drivers/kimiantonelli.avif",
    bgGradient: "bg-gradient-to-br from-[#00b295] via-[#008f77] to-[#006b59]",
  },
  {
    id: "leclerc",
    firstName: "Charles",
    lastName: "Leclerc",
    team: "Ferrari",
    number: "16",
    country: "MC",
    image: "/drivers/charlesleclerc.avif",
    bgGradient: "bg-gradient-to-br from-[#ce0000] via-[#a30000] to-[#7a0000]",
  },
  {
    id: "hamilton",
    firstName: "Lewis",
    lastName: "Hamilton",
    team: "Ferrari",
    number: "44",
    country: "GB",
    image: "/drivers/lewishamilton.avif",
    bgGradient: "bg-gradient-to-br from-[#ce0000] via-[#a30000] to-[#7a0000]",
  },
  {
    id: "norris",
    firstName: "Lando",
    lastName: "Norris",
    team: "McLaren",
    number: "1",
    country: "GB",
    image: "/drivers/landonorris.avif",
    bgGradient: "bg-gradient-to-br from-[#d96b00] via-[#b35400] to-[#8c3e00]",
  },
  {
    id: "piastri",
    firstName: "Oscar",
    lastName: "Piastri",
    team: "McLaren",
    number: "81",
    country: "AU",
    image: "/drivers/oscarpiastri.avif",
    bgGradient: "bg-gradient-to-br from-[#d96b00] via-[#b35400] to-[#8c3e00]",
  },
  {
    id: "verstappen",
    firstName: "Max",
    lastName: "Verstappen",
    team: "Red Bull Racing",
    number: "3",
    country: "NL",
    image: "/drivers/maxversteppen.avif",
    bgGradient: "bg-gradient-to-br from-[#122244] via-[#0c1833] to-[#070e20]",
  },
  {
    id: "hadjar",
    firstName: "Isack",
    lastName: "Hadjar",
    team: "Red Bull Racing",
    number: "6",
    country: "FR",
    image: "/drivers/isackhadjar.avif",
    bgGradient: "bg-gradient-to-br from-[#122244] via-[#0c1833] to-[#070e20]",
  },
  {
    id: "lawson",
    firstName: "Liam",
    lastName: "Lawson",
    team: "Racing Bulls",
    number: "30",
    country: "NZ",
    image: "/drivers/liamlawson.avif",
    bgGradient: "bg-gradient-to-br from-[#1a5ce6] via-[#1245b8] to-[#0b2f8a]",
  },
  {
    id: "lindblad",
    firstName: "Arvid",
    lastName: "Lindblad",
    team: "Racing Bulls",
    number: "41",
    country: "GB",
    image: "/drivers/arvidlindblad.avif",
    bgGradient: "bg-gradient-to-br from-[#1a5ce6] via-[#1245b8] to-[#0b2f8a]",
  },
  {
    id: "gasly",
    firstName: "Pierre",
    lastName: "Gasly",
    team: "Alpine",
    number: "10",
    country: "FR",
    image: "/drivers/piergasly.avif",
    bgGradient: "bg-gradient-to-br from-[#008ecb] via-[#006fa0] to-[#004f73]",
  },
  {
    id: "colapinto",
    firstName: "Franco",
    lastName: "Colapinto",
    team: "Alpine",
    number: "43",
    country: "AR",
    image: "/drivers/francocolapinto.avif",
    bgGradient: "bg-gradient-to-br from-[#008ecb] via-[#006fa0] to-[#004f73]",
  },
  {
    id: "ocon",
    firstName: "Esteban",
    lastName: "Ocon",
    team: "Haas F1 Team",
    number: "31",
    country: "FR",
    image: "/drivers/estebaanocon.avif",
    bgGradient: "bg-gradient-to-br from-[#4a4d52] via-[#35383c] to-[#202224]",
  },
  {
    id: "bearman",
    firstName: "Oliver",
    lastName: "Bearman",
    team: "Haas F1 Team",
    number: "87",
    country: "GB",
    image: "/drivers/oliverbearman.avif",
    bgGradient: "bg-gradient-to-br from-[#4a4d52] via-[#35383c] to-[#202224]",
  },
  {
    id: "hulkenberg",
    firstName: "Nico",
    lastName: "Hulkenberg",
    team: "Audi",
    number: "27",
    country: "DE",
    image: "/drivers/nicohulkenburg.avif",
    bgGradient: "bg-gradient-to-br from-[#b81414] via-[#8c0e0e] to-[#600808]",
  },
  {
    id: "bortoleto",
    firstName: "Gabriel",
    lastName: "Bortoleto",
    team: "Audi",
    number: "5",
    country: "BR",
    image: "/drivers/gabrielbortoleto.avif",
    bgGradient: "bg-gradient-to-br from-[#b81414] via-[#8c0e0e] to-[#600808]",
  },
  {
    id: "sainz",
    firstName: "Carlos",
    lastName: "Sainz",
    team: "Williams",
    number: "55",
    country: "ES",
    image: "/drivers/carlossainz.avif",
    bgGradient: "bg-gradient-to-br from-[#0038a8] via-[#002778] to-[#001748]",
  },
  {
    id: "albon",
    firstName: "Alexander",
    lastName: "Albon",
    team: "Williams",
    number: "23",
    country: "TH",
    image: "/drivers/alexanderalbon.avif",
    bgGradient: "bg-gradient-to-br from-[#0038a8] via-[#002778] to-[#001748]",
  },
  {
    id: "alonso",
    firstName: "Fernando",
    lastName: "Alonso",
    team: "Aston Martin",
    number: "14",
    country: "ES",
    image: "/drivers/fernandoalonso.avif",
    bgGradient: "bg-gradient-to-br from-[#00665e] via-[#004d47] to-[#00332e]",
  },
  {
    id: "stroll",
    firstName: "Lance",
    lastName: "Stroll",
    team: "Aston Martin",
    number: "18",
    country: "CA",
    image: "/drivers/lancestroll.avif",
    bgGradient: "bg-gradient-to-br from-[#00665e] via-[#004d47] to-[#00332e]",
  },
  {
    id: "perez",
    firstName: "Sergio",
    lastName: "Perez",
    team: "Cadillac",
    number: "11",
    country: "MX",
    image: "/drivers/sergioperez.avif",
    bgGradient: "bg-gradient-to-br from-[#525459] via-[#383a3d] to-[#212224]",
  },
  {
    id: "bottas",
    firstName: "Valtteri",
    lastName: "Bottas",
    team: "Cadillac",
    number: "77",
    country: "FI",
    image: "/drivers/valterribottas.avif",
    bgGradient: "bg-gradient-to-br from-[#525459] via-[#383a3d] to-[#212224]",
  },
];

export const DriversGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {driversData.map((driver) => (
        <div
          key={driver.id}
          className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 flex justify-between h-[180px] sm:h-[195px] border border-white/10 shadow-lg ${driver.bgGradient} group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/25`}
        >
          {/* Subtle dotted mesh texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"
            aria-hidden="true"
          />

          {/* Driver details (Left side) */}
          <div className="relative z-10 flex flex-col justify-between max-w-[60%] select-none">
            <div>
              <span className="block text-sm font-medium text-white/90 leading-tight">
                {driver.firstName}
              </span>
              <span className="block text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-none mt-0.5">
                {driver.lastName}
              </span>
              <span className="block text-[11px] font-bold text-white/75 uppercase tracking-wider mt-1">
                {driver.team}
              </span>
              <span className="inline-block font-display italic font-black text-3xl sm:text-4xl text-white/90 tracking-tighter leading-none mt-2 sm:mt-3">
                {driver.number}
              </span>
            </div>

            <div className="mt-auto pt-2">
              <FlagIcon country={driver.country} className="w-5 h-5" />
            </div>
          </div>

          {/* Driver Portrait cutout (Right side) */}
          <div className="absolute right-0 bottom-0 top-0 w-[55%] flex items-end justify-end pointer-events-none z-0 overflow-hidden">
            <img
              src={driver.image}
              alt={`${driver.firstName} ${driver.lastName}`}
              className="h-[95%] sm:h-full max-h-[195px] w-auto object-contain object-bottom filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
