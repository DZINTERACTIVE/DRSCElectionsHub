document.addEventListener('DOMContentLoaded', () => {
  const electoralVotes = {
    'AL':9,'AK':3,'AZ':11,'AR':6,'CA':54,'CO':10,'CT':7,'DE':3,'DC':3,'FL':30,'GA':16,'HI':4,'ID':4,'IL':19,
    'IN':11,'IA':6,'KS':6,'KY':8,'LA':8,'ME':4,'MD':10,'MA':11,'MI':15,'MN':10,'MS':6,'MO':10,'MT':4,'NE':5,
    'NV':6,'NH':4,'NJ':14,'NM':5,'NY':28,'NC':16,'ND':3,'OH':17,'OK':7,'OR':8,'PA':19,'RI':4,'SC':9,'SD':3,
    'TN':11,'TX':40,'UT':6,'VT':3,'VA':13,'WA':12,'WV':4,'WI':10,'WY':3
  };

  const electionResults = {}; // all unassigned
  const totals = { democrat:0, republican:0, undecided:0 };
  const totalVotes = Object.values(electoralVotes).reduce((a,b)=>a+b,0);

  for(const state in electoralVotes){
    const party = electionResults[state] || 'undecided';
    totals[party] += electoralVotes[state];
  }
  totals.undecided = totalVotes - totals.democrat - totals.republican;

  const mapData = {};
  for(const state in electoralVotes){
    mapData[state] = { fillKey:'UNASSIGNED', votes:electoralVotes[state] };
  }

  // Create tooltip div
  const tooltip = d3.select('body')
    .append('div')
    .attr('id','tooltip')
    .style('position','absolute')
    .style('pointer-events','none')
    .style('background','rgba(0,0,0,0.85)')
    .style('color','#fff')
    .style('padding','8px 12px')
    .style('border-radius','6px')
    .style('font-size','14px')
    .style('font-weight','600')
    .style('display','none');

  const map = new Datamap({
    element: document.getElementById('map-container'),
    scope: 'usa',
    responsive:true,
    fills: { 'DEMOCRAT':'#2563eb','REPUBLICAN':'#dc2626','UNASSIGNED':'transparent','defaultFill':'transparent' },
    data: mapData,
    geographyConfig:{
      borderColor:'#888',
      highlightFillColor:'#444', // subtle highlight
      highlightBorderColor:'#fff',
      highlightBorderWidth:2,
      highlightOnHover:true,
      popupOnHover:false // we handle tooltip ourselves
    }
  });

  d3.select('#map-container svg rect').remove();

  map.svg.selectAll('.datamaps-subunit')
    .on('mouseover', function(d){
      const state = d.id;
      const data = mapData[state];
      tooltip.style('display','block')
             .html(`<strong>${d.properties.name}</strong><br/>
                    Electoral Votes: ${data.votes}<br/>
                    Party: ${data.fillKey==='UNASSIGNED'?'Undecided':data.fillKey.charAt(0)+data.fillKey.slice(1).toLowerCase()}`);
      if(data.fillKey==='UNASSIGNED'){
        d3.select(this).style('fill','#666'); // subtle hover
      }
    })
    .on('mousemove', function(){
      tooltip.style('top', (d3.event.pageY + 15) + 'px')
             .style('left', (d3.event.pageX + 15) + 'px');
    })
    .on('mouseout', function(d){
      tooltip.style('display','none');
      const state = d.id;
      if(mapData[state].fillKey==='UNASSIGNED'){
        d3.select(this).style('fill','transparent');
      }
    });

  // Zoom & pan
  const zoom = d3.behavior.zoom()
    .scaleExtent([0.5,8])
    .on('zoom', ()=> map.svg.selectAll('g').attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`));
  map.svg.call(zoom);

  // Update vote bars
  const demPercent = totals.democrat/538*100;
  const repPercent = totals.republican/538*100;

  document.getElementById('democrat-votes').textContent = totals.democrat;
  document.getElementById('republican-votes').textContent = totals.republican;
  document.getElementById('undecided-votes').textContent = totals.undecided;

  document.getElementById('democrat-bar').style.width = demPercent + '%';
  document.getElementById('republican-bar').style.width = repPercent + '%';
});
