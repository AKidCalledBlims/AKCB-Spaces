require('dotenv').config();
const fs = require('fs');
const needle = require('needle');
const CronJob = require('cron').CronJob;
const QRCode = require("qrcode-svg");

const token = process.env.BEARER_TOKEN;

const endpointUrl = `https://api.twitter.com/2/spaces/search`;

const _query = 'AKCB';

async function searchSpaces() {
    const params = {
        'query': _query,
        'space.fields': 'title,created_at,scheduled_start,started_at,participant_count',
        'expansions': 'creator_id,host_ids'
    }

    const res = await needle('get', endpointUrl, params, {
        headers: {
            "User-Agent": "v2SpacesSearchJS",
            "authorization": `Bearer ${token}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request');
    }
}

(async () => {

    try {
        updateSearch();
        var job_update = new CronJob('0 */5 * * * *', function () {
            updateSearch();
        }, null, true);
        job_update.start();

    } catch (e) {
        console.log('error', e);
    }
})();

async function updateSearch() {
    const response = await searchSpaces();

    console.dir(response, {
        depth: null
    });
    let spaces = [];
    if (response.error || response?.data.length === 0) {
        return
    }
    // lookup creator and hosts from includes

    let _live = []
    let _scheduled = []

    response?.data.forEach(s => {

        const _creator_match = (e) => e.id === s.creator_id
        // console.log('creator user index:', response.includes.users.findIndex(_creator_match))
        s.creator = response.includes.users[response.includes.users.findIndex(_creator_match)]
        s.hosts = []
        s.host_ids.forEach(h => {
            const _host_match = (e) => e.id === h
            // console.log('host user index', response.includes.users.findIndex(_host_match))
            s.hosts.push(response.includes.users[response.includes.users.findIndex(_host_match)])
        })
        delete s.creator_id
        delete s.host_ids
        s.url = `https://twitter.com/i/spaces/${s.id}`

        let _svg = 
        s.svg = new QRCode({
            content: s.url,
            padding: 0,
            width: 128,
            height: 128,
            color: "#cccccc",
            background: "transparent",
            join: true, 
            ecl: "L",
            container: "svg-viewbox"
        }).svg().split('"').join('\'').split('\r\n').join('');

        if(s.state === 'live'){
            s.d = new Date(s.started_at).toUTCString()
            s.ts = new Date(s.started_at)
            _live.push(s)
        } else {
            s.d = new Date(s.scheduled_start).toUTCString()
            s.ts = new Date(s.scheduled_start)
            _scheduled.push(s)
        }
        // spaces.push(s);
    });

    _live.sort((a, b) => {
        return a.ts - b.ts;
    });

    _scheduled.sort((a, b) => {
        return a.ts - b.ts;
    });

    let _sorted = _live.concat(_scheduled)

    _sorted.forEach(_s => {
        delete _s.ts
        delete _s.d
    })

    console.dir(_sorted, {
        depth: null
    });

    fs.writeFileSync(`${process.env.CACHE}/AKCB_spaces.json`, JSON.stringify(_sorted));
    console.log('ok...');
}
