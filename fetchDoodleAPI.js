const fs = require('fs');
const path = require('path');
const BEARER = fs.readFileSync(path.resolve(__dirname, 'bearer.txt'), 'utf8');
const spawn = require('child_process').spawn;
const config = require('./config');

const run = (commandLine) => new Promise(function (resolve, reject) {
    const [command, ...args] = commandLine.split(/\s+/)
    const child = spawn(command, args)
    const output = []
    const stderr = []
    child.stdout.on('data', chunk => {
        output.push(chunk)
    })
    child.stderr.on('data', chunk => {
        stderr.push(chunk)
    })
    child.on('close', () => resolve({
        output: output.join('').trim(),
        stderr: stderr.join('').trim()
    }))
    child.on('error', error => reject(error))
})

const curlLocation = path.resolve("C://tools//cygwin//bin//curl.exe");

(async function main() {
    console.log('START');
    // activities
    const doodle = [];
    const hunderdaysago = new Date().getTime() - (100 * 24 * 60 * 60 * 1000);
    // curl 'https://api.doodle.com/scheduling/activities?pageSize=50' --compressed -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://doodle.com/' -H 'Authorization: ${BEARER}' -H 'Content-Type: application/json' -H 'Origin: https://doodle.com' -H 'Connection: keep-alive' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-site' -H 'TE: trailers'
    let execResult = {};
    try {
        execResult = await run(`${curlLocation} 'https://api.doodle.com/scheduling/activities?pageSize=50' --compressed -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://doodle.com/' -H 'Authorization: ${BEARER}' -H 'Content-Type: application/json' -H 'Origin: https://doodle.com' -H 'Connection: keep-alive' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-site' -H 'TE: trailers'`);
    } catch (e) {
        console.log(`activities fetch failed`);
        console.log(e);
        throw e;
    }
    if (execResult.output === '') {
        console.log('Bearer token expired!')
        throw new Error('Bearer token expired')
    }
    const activities = JSON.parse(execResult.output);
    // const activities = {
    //     "page": 0,
    //     "pageSize": 50,
    //     "pageCount": 2,
    //     "activities": [
    //         {
    //             "id": "dwkZGMJd",
    //             "title": "KG4DI Workshop - December/January alternative",
    //             "iconUrl": "https://6a5edc300520d4037dd6-0732807511066685711db213ddc1d2df.ssl.cf2.rackcdn.com/wltk60eg61xik90zeh5ne7fccbw6z7sc",
    //             "organizerId": "445qs8hr1dd2449r9dk05vaqazhq4pf6",
    //             "organizerName": "Ben De Meester",
    //             "type": "GROUPS",
    //             "state": "CLOSED",
    //             "optionCount": 16,
    //             "startAt": "2024-01-23T00:00:00Z",
    //             "endAt": "2024-01-24T00:00:00Z",
    //             "updatedAt": "2023-12-18T11:34:32.013471Z",
    //             "createdAt": "2023-10-23T12:40:19.701864Z" }
    //     ]
    // };
    for (let index = 0; index < activities.activities.length; index++) {
        const activity = activities.activities[index];
        console.log(`doing ${activity.title}`);
        if (activity.state === "CLOSED" || ((new Date(activity.updatedAt)).getTime() < hunderdaysago) || (config.exclude.indexOf(activity.title) >= 0)) {
            continue;
        }
        const doodleActivity = {
            name: activity.title,
            state: activity.state,
            link: `https://doodle.com/meeting/participate/id/${activity.id}`,
            id: activity.id,
        };
        // curl 'https://api.doodle.com/scheduling/scheduling-attempts/${id}/options?pageSize=20&page=0&sortBy=START_AT' --compressed -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: application/json, application/json+problem' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://doodle.com/' -H 'Content-Type: application/json' -H 'Authorization: ${BEARER}' -H 'Origin: https://doodle.com' -H 'Connection: keep-alive' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-site' -H 'TE: trailers'
        try {
            execResult = await run(`${curlLocation} 'https://api.doodle.com/scheduling/scheduling-attempts/${activity.id}/options?pageSize=20&page=0&sortBy=START_AT' --compressed -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: application/json, application/json+problem' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://doodle.com/' -H 'Content-Type: application/json' -H 'Authorization: ${BEARER}' -H 'Origin: https://doodle.com' -H 'Connection: keep-alive' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-site' -H 'TE: trailers'`);
        } catch (e) {
            console.log(`activities options fetch failed`);
            console.log(e);
            throw e;
        }
        const options = JSON.parse(execResult.output);
        // const options = {
        //     "pageCount":1,"pageSize":16,"page":0,"totalCount":16,
        //     "options":[
        //         {
        //             "id":"dJZvEDVg","startAt":"2024-01-05T08:00:00Z","endAt":"2024-01-05T09:00:00Z",
        //             "allDay":false,"collisionAllowed":false,"voteCount":3,"voteScore":3
        //         }
        //     ]
        // };
        doodleActivity.options = options.options;
        console.log(`got ${activity.title} options`);
        if (activity.organizerName === "Ben De Meester") {
            doodleActivity.options.forEach(option => {
                option.vote = "YES"
            })
            continue;
        }
        // curl 'https://api.doodle.com/scheduling/scheduling-attempts/${id}/participants/me' --compressed -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://doodle.com/' -H 'Content-Type: application/json' -H 'Authorization: ${BEARER}' -H 'Origin: https://doodle.com' -H 'Connection: keep-alive' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-site' -H 'TE: trailers'
        try {
            execResult = await run(`${curlLocation} 'https://api.doodle.com/scheduling/scheduling-attempts/${activity.id}/participants/me' --compressed -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' -H 'Accept: */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate, br' -H 'Referer: https://doodle.com/' -H 'Content-Type: application/json' -H 'Authorization: ${BEARER}' -H 'Origin: https://doodle.com' -H 'Connection: keep-alive' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-site' -H 'TE: trailers'`);
        } catch (e) {
            console.log(`activities votes fetch failed`);
            console.log(e);
            throw e;
        }
        const votes = JSON.parse(execResult.output).votes;
        // const votes = {
        //     "id":"b826y4M2","userId":"445qs8hr1dd2449r9dk05vaqazhq4pf6","name":"Ben De Meester","email":"demeester.ben@gmail.com","timezone":"Europe/Brussels;tz_belgium_brussels;Belgium, Brussels;GMT+1",
        //     "votes":[
        //         {
        //             "id":"axzvpn9B",
        //             "optionId":"dP1B6m24",
        //             "type":"NO",
        //             "answers":[],
        //             "queryParameters":[]
        //         }
        //     ],
        //     "notify":false,"authToken":"ZGVtZWVzdGVyLmJlbkBnbWFpbC5jb207QmVuIERlIE1lZXN0ZXI=.Q0Y8lVdZ7v9K5K7Uyz"
        // };
        console.log(`got my ${activity.title} votes`);
        doodleActivity.options.forEach(option => {
            option.vote = "NO";
            const optionVotes = votes.filter(v => v.optionId === option.id);
            if (optionVotes.length > 0) {
                option.vote = optionVotes[0].type
            }
        })
        doodle.push(doodleActivity)
    }
    fs.writeFileSync(path.resolve(__dirname, 'doodle.json'), JSON.stringify(doodle, null, 2), 'utf8');
    console.log('STOP');
})();
