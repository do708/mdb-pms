// Nederlandse feestdagen, automatisch berekend voor elk jaar.
// Inclusief de paasgebonden dagen (Goede Vrijdag, Pasen, Hemelvaart, Pinksteren)
// via de Gauss/Meeus-formule voor eerste paasdag.

export interface Holiday {
    date:string;   // YYYY-MM-DD
    name:string;
}



function pad(n:number):string {
    return String(n).padStart(2,"0");
}


function iso(year:number, month:number, day:number):string {
    return `${year}-${pad(month)}-${pad(day)}`;
}



// Eerste paasdag (Meeus/Jones/Butcher-algoritme)
function easterSunday(year:number):{ month:number; day:number } {

    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return { month, day };

}



function addDays(
    year:number,
    month:number,
    day:number,
    add:number
):string {

    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + add);

    return iso(
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate()
    );

}



// Alle Nederlandse feestdagen voor een gegeven jaar.
export function dutchHolidays(year:number):Holiday[] {

    const easter = easterSunday(year);

    const easterIso =
        iso(year, easter.month, easter.day);


    const holidays:Holiday[] = [

        { date:iso(year, 1, 1),  name:"Nieuwjaarsdag" },

        { date:addDays(year, easter.month, easter.day, -2), name:"Goede Vrijdag" },

        { date:easterIso, name:"Eerste Paasdag" },

        { date:addDays(year, easter.month, easter.day, 1), name:"Tweede Paasdag" },

        // Koningsdag: 27 april, maar op zondag 26 april
        { date:koningsdag(year), name:"Koningsdag" },

        { date:iso(year, 5, 5), name:"Bevrijdingsdag" },

        { date:addDays(year, easter.month, easter.day, 39), name:"Hemelvaartsdag" },

        { date:addDays(year, easter.month, easter.day, 49), name:"Eerste Pinksterdag" },

        { date:addDays(year, easter.month, easter.day, 50), name:"Tweede Pinksterdag" },

        { date:iso(year, 12, 25), name:"Eerste Kerstdag" },

        { date:iso(year, 12, 26), name:"Tweede Kerstdag" }

    ];


    return holidays;

}



function koningsdag(year:number):string {

    // 27 april, tenzij dat een zondag is -> dan 26 april
    const d = new Date(year, 3, 27);

    if(d.getDay() === 0){
        return iso(year, 4, 26);
    }

    return iso(year, 4, 27);

}



// Handige lookup: geef een map van datum -> naam voor een reeks jaren.
export function holidayMap(years:number[]):Record<string,string> {

    const map:Record<string,string> = {};

    for(const year of years){
        for(const h of dutchHolidays(year)){
            map[h.date] = h.name;
        }
    }

    return map;

}
