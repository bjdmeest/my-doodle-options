const ics = require('ics')
const doodle = require('./doodle.json');
const config = require('./config.json');
const { DateTime } = require("luxon");
const fs = require('fs');

const events = [];
doodle.forEach(invite => {
    if (config.skip.indexOf(invite.name) >= 0) {
        return;
    }
    if (!invite.participations) {
        return;
    }
    const myParticipations = invite.participations.filter(p => p.name?.endsWith('\nYou'));
    if (!myParticipations.length > 0) {
        return;
    }
    myParticipations[0].options.forEach(option => {
        if (option.value === 'Declined') {
            return;
        }
        const {start, end} = parseDate(option.date);
        events.push({
            start: [start.year, start.month, start.day, start.hour, start.minute],
            end: [end.year, end.month, end.day, end.hour, end.minute],
            title: `[Doodle]: ${invite.name}`,
            description: `Doodle invite for ${invite.name},\nlink: ${invite.link}`,
            // location: 'Folsom Field, University of Colorado (finish line)',
            url: invite.link,
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
fs.writeFileSync(`${__dirname}/doodle.ics`, value)

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
    if(!str.match(/$\d{4}/)) {
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