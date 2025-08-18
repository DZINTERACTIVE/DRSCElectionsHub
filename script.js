document.addEventListener('DOMContentLoaded', () => {
    const electoralVotes = {
        'AL': 9,'AK': 3,'AZ': 11,'AR': 6,'CA': 54,'CO': 10,'CT': 7,
        'DE': 3,'DC': 3,'FL': 30,'GA': 16,'HI': 4,'ID': 4,'IL': 19,
        'IN': 11,'IA': 6,'KS': 6,'KY': 8,'LA': 8,'ME': 4,'MD': 10,
        'MA': 11,'MI': 15,'MN': 10,'MS': 6,'MO': 10,'MT': 4,'NE': 5,
        'NV': 6,'NH': 4,'NJ': 14,'NM': 5,'NY': 28,'NC': 16,'ND': 3,
        'OH': 17,'OK': 7,'OR': 8,'PA': 19,'RI': 4,'SC': 9,'SD': 3,
        'TN': 11,'TX': 40,'UT': 6,'VT': 3,'VA': 13,'WA': 12,'WV': 4,
        'WI': 10,'WY': 3
    };

    // Assign states to parties: 'democrat', 'republican', or leave undefined for undecided
    const electionResults = {
        'CA': 'democrat',
        'TX': 'republican',
        'FL': 'undecided'
    };

    const partyColors = {
        democrat: '#3b82f6',
        republican: '#ef4444',
        undecided: '#a8a29e'
    };

    const mapData = {};
    const totals = { democrat: 0, republican: 0, undecided: 0 };
    const totalElectoralVotes = Object.values(electoralVotes).reduce((sum, v) => sum + v, 0);

    for (const state in electoralVotes) {
        const party = electionResults[state] || 'undecided';
        mapData[state] = { fillKey: party.toUpperCase(), party: party, votes: electoralVotes[state] };
        totals[party] += electoralVotes[state];
    }
    totals.undecided = totalElectoralVotes - totals.democrat - totals.republican;

    const map = new Datamap({
        element: document.getElementById('map-container'),
        scope: 'usa',
        responsive: true,
        fills: {
            'DEMOCRAT': partyColors.democrat,
            'REPUBLICAN': partyColors.republican,
            'UNDECIDED': partyColors.undecided,
            'defaultFill': 'transparent' // removes black rectangle
        },
        data: mapData,
        geographyConfig: {
            popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>${geo.properties.name}</strong><br/>Electoral Votes: ${data.votes}<br/>Party: ${data.party.charAt(0).toUpperCase()+data.party.slice(1)}</div>`,
            borderColor: '#000',
            highlightFillColor: (data) => mapData[data.id] ? partyColors[mapData[data.id].party] : partyColors.undecided,
            highlightBorderColor: '#fff',
            highlightBorderWidth: 2
        },
        // Prevent Datamaps from drawing a black rectangle background
        setProjection: function(element) {
            var projection = d3.geo.albersUsa()
                .scale(1000)
                .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
            var path = d3.geo.path().projection(projection);
            return { path: path, projection: projection };
        }
    });

    // Scroll & drag zoom
    const zoom = d3.behavior.zoom()
        .scaleExtent([1, 8])
        .on('zoom', () => {
            map.svg.selectAll('g').attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`);
        });
    map.svg.call(zoom);

    // Center map
    function centerMap() {
        const container = document.getElementById('map-container');
        const usaGroup = map.svg.select('g.datamaps-subunits');
        if (!usaGroup.empty()) {
            const bbox = usaGroup.node().getBBox();
            const scale = Math.min(container.offsetWidth / bbox.width, container.offsetHeight / bbox.height) * 0.95;
            const tx = (container.offsetWidth - bbox.width * scale) / 2 - bbox.x * scale;
            const ty = (container.offsetHeight - bbox.height * scale) / 2 - bbox.y * scale;
            zoom.translate([tx, ty]).scale(scale);
            map.svg.selectAll('g').attr('transform', `translate(${tx},${ty})scale(${scale})`);
        }
    }
    setTimeout(centerMap, 100);
    window.addEventListener('resize', () => map.resize());

    // Update vote totals
    document.getElementById('democrat-votes').textContent = totals.democrat;
    document.getElementById('republican-votes').textContent = totals.republican;
    document.getElementById('undecided-votes').textContent = totals.undecided;

    // Update winner banner
    const winnerBanner = document.getElementById('winner-banner');
    if (totals.democrat >= 270) { winnerBanner.innerHTML='<h2>Democrat Wins!</h2>'; winnerBanner.classList.add('democrat'); }
    else if (totals.republican >= 270) { winnerBanner.innerHTML='<h2>Republican Wins!</h2>'; winnerBanner.classList.add('republican'); }
});
