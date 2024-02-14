const ics = require('ics')
const doodle = require('./doodle.json');
const config = require('./config');
const { DateTime } = require("luxon");
const fs = require('fs');
const fsp = require('fs').promises;
const { argv } = require('process');
const ftp = require("basic-ftp");

(async function main() {
    const events = [];
    doodle.forEach(activity => {
        if (config.exclude.indexOf(activity.name) >= 0) {
            return;
        }
        activity.options.forEach(option => {
            if (option.vote === 'NO') {
                return;
            }
            const start = option.allDay ? (DateTime.fromISO(option.startAt)).set({ hour: 8 }) : DateTime.fromISO(option.startAt);
            const end = option.allDay ? (DateTime.fromISO(option.startAt)).set({ hour: 17 }) : DateTime.fromISO(option.endAt);
            events.push({
                start: [start.year, start.month, start.day, start.hour, start.minute],
                end: [end.year, end.month, end.day, end.hour, end.minute],
                title: `[Doodle]: ${activity.name}`,
                description: `Doodle invite for ${activity.name},\nlink: ${activity.link}`,
                // location: 'Folsom Field, University of Colorado (finish line)',
                url: activity.link,
                // geo: { lat: 40.0095, lon: 105.2669 },
                // categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
                // status: 'CONFIRMED',
                // busyStatus: 'BUSY',
                // organizer: { name: 'Admin', email: 'Race@BolderBOULDER.com' },
                // attendees: [
                // { name: 'Adam Gibbons', email: 'adam@example.com', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
                // { name: 'Brittany Seaton', email: 'brittany@example2.org', dir: 'https://linkedin.com/in/brittanyseaton', role: 'OPT-PARTICIPANT' }
                // ]
            })
        })
    })

    const { error, value } = ics.createEvents(events)

    if (error) {
        console.log(error)
        return
    }
    await fsp.writeFile(`${__dirname}/doodle.ics`, value)

    if (argv[2] === '-u') {
        const client = new ftp.Client()
        client.ftp.verbose = true
        try {
            await client.access({
                host: config.ftp.host,
                user: config.ftp.username,
                password: config.ftp.password
            })
            await client.uploadFrom(`${__dirname}/doodle.ics`, config.ftp.target)
        }
        catch (err) {
            console.log(err)
        }
        client.close()
    }
})()

function parseDate(str) {
    const orig = str;
    str = str.replace(/\n/g, '-');
    str = str.replace("JAN", '01');
    str = str.replace("FEB", '02');
    str = str.replace("MAR", '03');
    str = str.replace("APR", '04');
    str = str.replace("MAY", '05');
    str = str.replace("JUN", '06');
    str = str.replace("JUL", '07');
    str = str.replace("AUG", '08');
    str = str.replace("SEP", '09');
    str = str.replace("OCT", '10');
    str = str.replace("NOV", '11');
    str = str.replace("DEC", '12');
    str = str.replace("-MON", '');
    str = str.replace("-TUE", '');
    str = str.replace("-WED", '');
    str = str.replace("-THU", '');
    str = str.replace("-FRI", '');
    str = str.replace("-SAT", '');
    str = str.replace("-SUN", '');
    if (!str.match(/$\d{4}/)) {
        str = (new Date()).getFullYear() + '-' + str;
    }
    const strSplits = str.split('-')
    strSplits[2] = strSplits[2].padStart(2, '0');
    str = strSplits.slice(0, 3).join('-');
    let endstr = str;
    if (strSplits[3].endsWith('M')) {
        const internalSplit = strSplits[3].split(' ');
        const hourMinute = internalSplit[0].split(':');
        const hour = Number(hourMinute[0]) + ((internalSplit[1] === 'PM' && hourMinute[0] !== '12') ? 12 : 0);
        const minute = Number(hourMinute[1])
        str += `T${('' + hour).padStart(2, '0')}:${('' + minute).padStart(2, '0')}:00`
        if (strSplits[4].endsWith('M')) {
            const internalSplit = strSplits[4].split(' ');
            const hourMinute = internalSplit[0].split(':');
            const hour = Number(hourMinute[0]) + ((internalSplit[1] === 'PM' && hourMinute[0] !== '12') ? 12 : 0);
            const minute = Number(hourMinute[1])
            endstr += `T${('' + hour).padStart(2, '0')}:${('' + minute).padStart(2, '0')}:00`
        } else {
            endstr += `T${('' + hour + 1).padStart(2, '0')}:${('' + minute).padStart(2, '0')}:00`
        }
    } else {
        str += `T09:00:00`;
        endstr += 'T17:00:00';
    }

    return {
        start: DateTime.fromISO(str),
        end: DateTime.fromISO(endstr)
    }
}