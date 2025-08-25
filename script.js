document.addEventListener('DOMContentLoaded', () => {
  const electoralVotes = {
    'AL':9,'AK':3,'AZ':11,'AR':6,'CA':54,'CO':10,'CT':7,'DE':3,'DC':3,'FL':30,'GA':16,'HI':4,'ID':4,'IL':19,
    'IN':11,'IA':6,'KS':6,'KY':8,'LA':8,'ME':4,'MD':10,'MA':11,'MI':15,'MN':10,'MS':6,'MO':10,'MT':4,'NE':5,
    'NV':6,'NH':4,'NJ':14,'NM':5,'NY':28,'NC':16,'ND':3,'OH':17,'OK':7,'OR':8,'PA':19,'RI':4,'SC':9,'SD':3,
    'TN':11,'TX':40,'UT':6,'VT':3,'VA':13,'WA':12,'WV':4,'WI':10,'WY':3
  };

  const electionResults = {
    'CA':'democrat','NY':'democrat','TX':'republican','FL':'republican','GA':'lean-democrat',
    'NC':'lean-republican','AZ':'lean-republican','NM':'democrat','CO':'democrat','UT':'republican',
    'NV':'lean-republican','ID':'republican','WA':'democrat','OR':'democrat','WY':'republican',
    'MT':'republican','OK':'republican','AR':'republican','LA':'republican','MS':'republican',
    'AL':'republican','TN':'republican','SC':'republican','KY':'republican','VA':'lean-democrat',
    'WV':'republican','MD':'democrat','DE':'democrat','NJ':'lean-democrat','PA':'lean-republican',
    'OH':'republican','IN':'republican','IL':'democrat','IA':'republican','NE':'lean-republican',
    'SD':'republican','ND':'republican','MN':'democrat','WI':'lean-republican','MI':'lean-republican',
    'CT':'democrat','RI':'democrat','MA':'democrat','VT':'democrat','NH':'democrat','ME':'lean-democrat',
    'HI':'democrat','KS':'republican','MO':'republican','AK':'republican','DC':'democrat'
  };

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

  const map = new Datamap({
    element: document.getElementById('map-container'),
    scope: 'usa',
    responsive:true,
    fills:{ 
      'DEMOCRAT':'#2563eb',
      'REPUBLICAN':'#dc2626',
      'LEAN-DEMOCRAT':'#FFD700',
      'LEAN-REPUBLICAN':'#FFD700',
      'UNDECIDED':'transparent','defaultFill':'transparent'
    },
    data: mapData,
    geographyConfig:{
      borderColor:'#888',
      highlightFillColor:'#666',
      highlightBorderColor:'#fff',
      highlightBorderWidth:2,
      highlightOnHover:true,
      popupOnHover:false
    }
  });

  // Zoom
  const zoom = d3.behavior.zoom()
    .scaleExtent([0.5,8])
    .on('zoom', ()=> map.svg.selectAll('g').attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`));
  map.svg.call(zoom);

  // Hover & click
  map.svg.selectAll('.datamaps-subunit')
    .on('mouseover', d => {
      const data = mapData[d.id];
      tooltip.style('display','block').html(`<strong>${d.properties.name}</strong><br/>
        EVs: ${data.votes}<br/>Party: ${data.party}`);
    })
    .on('mousemove', function(){
      tooltip.style('top', (d3.event.pageY + 15) + 'px')
             .style('left', (d3.event.pageX + 15) + 'px');
    })
    .on('mouseout', () => tooltip.style('display','none'))
    .on('click', d => loadCounties(d.id));

  document.getElementById('democrat-bar').style.width = (totals.democrat/538*100)+'%';
  document.getElementById('republican-bar').style.width = (totals.republican/538*100)+'%';

  async function loadCounties(stateId){
    map.svg.selectAll('.datamaps-subunit').transition().duration(200).style('opacity',0.3);

    const projection = d3.geoAlbersUsa().translate([map.options.width/2, map.options.height/2]).scale(map.options.width*1.2);
    const path = d3.geoPath().projection(projection);

    const countyData = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
    const fipsStr = stateFIPS(stateId).toString().padStart(2,'0');

    const counties = topojson.feature(countyData, countyData.objects.counties).features
      .filter(c => c.id.toString().startsWith(fipsStr));

    map.svg.selectAll('.county').remove();
    const g = map.svg.append('g').attr('class','counties');

    g.selectAll('.county')
      .data(counties)
      .enter()
      .append('path')
      .attr('class','county')
      .attr('d', path)
      .attr('fill', d => {
        const stateParty = mapData[stateId]?.party || 'undecided';
        if(stateParty.startsWith('lean')){
          return Math.random() < 0.5 ? '#2563eb' : '#dc2626';
        }
        return stateParty === 'democrat' ? '#2563eb' :
               stateParty === 'republican' ? '#dc2626' : 'transparent';
      })
      .attr('stroke','#fff')
      .attr('stroke-width',0.5)
      .attr('opacity',0.7)
      .on('mouseover', d => tooltip.style('display','block').html(`County ID: ${d.id}`))
      .on('mousemove', function(){
        tooltip.style('top', (d3.event.pageY + 15) + 'px')
               .style('left', (d3.event.pageX + 15) + 'px');
      })
      .on('mouseout', () => tooltip.style('display','none'));

    if(!document.getElementById('backBtn')){
      const btn = document.createElement('button');
      btn.id='backBtn';
      btn.textContent='Back to States';
      btn.style.cssText='position:absolute;top:10px;left:10px;z-index:20;padding:6px 12px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;';
      document.body.appendChild(btn);

      btn.onclick = () => {
        btn.remove();
        map.svg.selectAll('.counties').remove();
        map.svg.selectAll('.datamaps-subunit').transition().duration(200).style('opacity',1);
      };
    }
  }

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
