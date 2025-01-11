import axios from 'axios';
import https from 'https';
import { transportConfig } from '../config';
import "../interfaces";
import { Departure, DepartureLine } from '../interfaces';

const baseUrl = "https://v6.bvg.transport.rest/stops/"
const queryParams = "?when=in%2010%20minutes&duration=120&remarks=false&pretty=false"

async function getDepartures(): Promise<DepartureLine[]> {
    const allDepartures: DepartureLine[] = [];
    try {
        for (const stop of transportConfig.stops) {
            const url = `${baseUrl}${stop.id}/departures${queryParams}`
            // force ipv4 since bvg rest doesn't support ipv6 https://github.com/derhuerst/bvg-rest/issues/21
            const response = await axios.get(url, { httpsAgent: new https.Agent({ family: 4 }), timeout: 30000 }).catch(error => {
                console.error('Error on get Departures request:', error);
                return { data: { departures: [] } }
            });
            const departures: any[] = response.data.departures;
            let filteredDepartures: Departure[] = departures
                .filter((departure: any) => stop.includeLines.includes(departure.line.name.toLowerCase()))
                .filter((departure: any) =>
                    !stop.excludeDestinations.some((destination: string) => departure.direction.includes(destination))
                )
                .map((departure: any) => ({
                    direction: departure.direction,
                    lineName: departure.line.name,
                    lineId: departure.line.id,
                    when: departure.when ? departure.when : departure.plannedWhen,
                    mode: departure.line.mode
                }));
            filteredDepartures = removeDup(filteredDepartures);
            const groupedDepartures: DepartureLine[] = groupAndSortDepartures(filteredDepartures)
            allDepartures.push(...groupedDepartures);
        }
        console.info(`found ${allDepartures.length} lines, reducing to 6 max`);
        const res = allDepartures.slice(0, 6);
        console.info(`all departures: ${allDepartures.map((departure) => `\n${departure.lineName} with ${departure.when.length} departures`)}`)
        return res; // only first 6 items
    } catch (error) {
        console.error('Error fetching or processing departure data:', error);
        return [];
    }
}

function removeDup(departures: Departure[]): Departure[] {
    const filtered: Departure[] = [];
    for (let i = 0; i < departures.length; i++) {
        const currentSchedule = departures[i];
        const prevSchedule = filtered[filtered.length - 1];
        if (!prevSchedule || currentSchedule.direction !== prevSchedule.direction) {
            filtered.push(currentSchedule);
        } else {
            if (diffInMinutes(prevSchedule.when, currentSchedule.when) >= 3) {
                filtered.push(currentSchedule);
            }
        }
    }
    return filtered;
}

function diffInMinutes(time1: string, time2: string): number {
    return Math.abs(new Date(time1).getTime() - new Date(time2).getTime()) / (1000 * 60);
}

function groupAndSortDepartures(departures: Departure[]): DepartureLine[] {
    const departureMap: { [key: string]: DepartureLine } = {};

    departures.forEach((departure) => {
        const { direction, lineName, lineId, when, mode } = departure;

        if (!departureMap[lineId]) {
            departureMap[lineId] = {
                direction,
                lineName,
                lineId,
                when: [],
                mode,
            };
        }

        departureMap[lineId].when.push(when);
    });

    const departureLines: DepartureLine[] = Object.values(departureMap);

    departureLines.forEach((departureLine) => {
        departureLine.when.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        departureLine.when = departureLine.when.slice(0, 4);
    });
    departureLines.sort((a, b) => a.lineName.localeCompare(b.lineName));
    let final: DepartureLine[] = [];
    const priorityItems = departureLines.filter(departureLine => 
        transportConfig.linePrioList.map(line => line.toLowerCase()).includes(departureLine.lineName.toLowerCase())
    );
    const nonPriorityItems = departureLines.filter(departureLine => 
        !transportConfig.linePrioList.map(line => line.toLowerCase()).includes(departureLine.lineName.toLowerCase())
    );
    
    final = priorityItems.concat(nonPriorityItems);
    return final;
}

function timeToHour(timeString: string): string {
    return new Date(timeString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function getMode(departureMode): string {
    return departureMode === "bus" ? "fa-bus" : "fa-train"
}

export async function getDepartureHtml(): Promise<string> {
    const noDeparturesHtml = `<div class="no-departures">No departures found</div>`;
    try {
        const filteredDepartures = await getDepartures();
        if (filteredDepartures.length === 0) return noDeparturesHtml;
        const departureHtml = filteredDepartures.map(line => `
            <div class="departure-container">
                <div class="departure-left-side">
                    <div class="departure-number">
                        <div class="info-icon fas ${getMode(line.mode)}"></div>
                        <span class="train-bus-number">${line.lineName}</span>
                    </div>
                    <div class="departure-station">${line.direction}</div>
                </div>
                <div class="departure">
                    ${line.when.map((time) => `<div class="info-text">${timeToHour(time)}</div>`).join('')}
                </div>
            </div>
        `).join('');
        return departureHtml;
    } catch (error) {
        console.error('Error fetching or processing data:', error);
        return noDeparturesHtml;
    }
}

