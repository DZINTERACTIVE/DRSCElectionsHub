document.addEventListener('DOMContentLoaded', () => {
  const electoralVotes = { /* same as before */ };
  const electionResults = { /* same as before */ };

  const totals = { democrat:0, republican:0, undecided:0 };
  const totalVotes = Object.values(electoralVotes).reduce((a,b)=>a+b,0);

  const mapData = {};
  for(const state in electoralVotes){
    const party = electionResults[state] || 'undecided';
    const mainParty = party.replace('lean-','');
    if(totals[mainParty]!==undefined) totals[mainParty] += electoralVotes[state];
    mapData[state] = { fillKey: party.toUpperCase(), votes:electoralVotes[state], party };
  }
  totals.undecided = totalVotes - totals.democrat - totals.republican;

  document.getElementById('democrat-votes').textContent = totals.democrat;
  document.getElementById('republican-votes').textContent = totals.republican;
  document.getElementById('undecided-votes').textContent = 'Undecided: ' + totals.undecided;

  const tooltip = d3.select('body').append('div').attr('id','tooltip');

  // Initial US Map
  const map = new Datamap({
    element: document.getElementById('map-container'),
    scope: 'usa',
    responsive:true,
    fills:{ 
      'DEMOCRAT':'#2563eb',
      'REPUBLICAN':'#dc2626',
      'LEAN-DEMOCRAT':'url(#leanDemPattern)',
      'LEAN-REPUBLICAN':'url(#leanRepPattern)',
      'UNDECIDED':'transparent',
      'defaultFill':'transparent' 
    },
    data: mapData,
    geographyConfig:{
      borderColor:'#888',
      highlightFillColor:'#444',
      highlightBorderColor:'#fff',
      highlightBorderWidth:2,
      highlightOnHover:true,
      popupOnHover:false
    },
    done: function(datamap) {
      datamap.svg.selectAll('.datamaps-subunit')
        .on('click', function(d){
          loadCounties(d.id); // Load counties of clicked state
        });
    }
  });

  const defs = map.svg.append("defs");

  function createLeanPattern(id, stripeColor){
    const pattern = defs.append("pattern")
      .attr("id", id)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8)
      .attr("patternTransform", "rotate(45)");
    pattern.append("rect").attr("width", 8).attr("height", 8).attr("fill", "#FFD700");
    pattern.append("rect").attr("width", 2).attr("height", 8).attr("fill", stripeColor);
    return pattern;
  }

  createLeanPattern("leanDemPattern", "#2563eb");
  createLeanPattern("leanRepPattern", "#dc2626");

  map.svg.selectAll('.datamaps-subunit')
    .on('mouseover', function(d){
      const state = d.id;
      const data = mapData[state];
      tooltip.style('display','block')
             .html(`<strong>${d.properties.name}</strong><br/>
                    EVs: ${data.votes}<br/>
                    Party: ${data.party.replace('lean-','').charAt(0).toUpperCase() + 
                           data.party.replace('lean-','').slice(1)}${data.party.startsWith('lean-')?' (Lean)':''}`);
      d3.select(this).transition().duration(200).style("fill-opacity", 0.8);
    })
    .on('mousemove', function(){
      tooltip.style('top', (d3.event.pageY + 15) + 'px')
             .style('left', (d3.event.pageX + 15) + 'px');
    })
    .on('mouseout', function(d){
      tooltip.style('display','none');
      d3.select(this).transition().duration(200).style("fill-opacity", 1);
    });

  // Zoom & pan
  const zoom = d3.behavior.zoom()
    .scaleExtent([0.5,8])
    .on('zoom', ()=> map.svg.selectAll('g').attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`));
  map.svg.call(zoom);

  const demPercent = totals.democrat/538*100;
  const repPercent = totals.republican/538*100;
  document.getElementById('democrat-bar').style.width = demPercent + '%';
  document.getElementById('republican-bar').style.width = repPercent + '%';

  // ---- Counties Layer ----
  async function loadCounties(stateId){
    // Hide US states layer
    map.svg.selectAll('.datamaps-subunit').style('display','none');

    const countyData = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');

    const counties = topojson.feature(countyData, countyData.objects.counties).features
      .filter(c => Math.floor(c.id / 1000) === parseInt(stateFIPS(stateId)));

    // assign fake lean/random party for simulation
    const countyMap = {};
    counties.forEach(c => {
      // Randomized lean based on state lean
      const stateParty = (mapData[stateId]?.party || 'undecided');
      let lean = stateParty.includes('lean') ? stateParty : Math.random() > 0.5 ? 'democrat' : 'republican';
      countyMap[c.id] = { fillKey: lean.toUpperCase(), votes: 1, party: lean };
    });

    const countyMapObj = new Datamap({
      element: document.getElementById('map-container'),
      scope: 'usa',
      done: map => {},
      geographyConfig: {
        borderColor:'#888',
        highlightFillColor:'#444',
        highlightBorderColor:'#fff',
        highlightBorderWidth:1,
        highlightOnHover:true,
        popupOnHover:false
      },
      fills:{
        'DEMOCRAT':'#2563eb',
        'REPUBLICAN':'#dc2626',
        'LEAN-DEMOCRAT':'url(#leanDemPattern)',
        'LEAN-REPUBLICAN':'url(#leanRepPattern)',
        'UNDECIDED':'transparent',
        'defaultFill':'transparent'
      },
      data: countyMap,
      setProjection: function(element){
        const projection = d3.geoAlbersUsa().translate([element.offsetWidth/2, element.offsetHeight/2]).scale(element.offsetWidth*1.2);
        const path = d3.geoPath().projection(projection);
        return {path: path, projection: projection};
      }
    });

    // Back button
    if(!document.getElementById('backBtn')){
      const btn = document.createElement('button');
      btn.id = 'backBtn';
      btn.textContent = 'Back to States';
      btn.style.position = 'absolute';
      btn.style.top = '10px';
      btn.style.left = '10px';
      btn.style.zIndex = '20';
      btn.style.padding = '6px 12px';
      btn.style.background = '#333';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      document.body.appendChild(btn);

      btn.onclick = () => {
        btn.remove();
        map.svg.selectAll('.datamaps-subunit').style('display','block');
        document.getElementById('map-container').innerHTML = '';
        map.render(); // re-render states
      };
    }
  }

  // Helper FIPS mapping for states
  function stateFIPS(stateId){
    const fips = {
      'AL':1,'AK':2,'AZ':4,'AR':5,'CA':6,'CO':8,'CT':9,'DE':10,'DC':11,'FL':12,'GA':13,'HI':15,'ID':16,
      'IL':17,'IN':18,'IA':19,'KS':20,'KY':21,'LA':22,'ME':23,'MD':24,'MA':25,'MI':26,'MN':27,'MS':28,
      'MO':29,'MT':30,'NE':31,'NV':32,'NH':33,'NJ':34,'NM':35,'NY':36,'NC':37,'ND':38,'OH':39,'OK':40,
      'OR':41,'PA':42,'RI':44,'SC':45,'SD':46,'TN':47,'TX':48,'UT':49,'VT':50,'VA':51,'WA':53,'WV':54,
      'WI':55,'WY':56
    };
    return fips[stateId];
  }
});
