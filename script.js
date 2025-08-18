document.addEventListener('DOMContentLoaded', () => {
  const electoralVotes = {
    'AL':9,'AK':3,'AZ':11,'AR':6,'CA':54,'CO':10,'CT':7,'DE':3,'DC':3,'FL':30,'GA':16,'HI':4,'ID':4,'IL':19,
    'IN':11,'IA':6,'KS':6,'KY':8,'LA':8,'ME':4,'MD':10,'MA':11,'MI':15,'MN':10,'MS':6,'MO':10,'MT':4,'NE':5,
    'NV':6,'NH':4,'NJ':14,'NM':5,'NY':28,'NC':16,'ND':3,'OH':17,'OK':7,'OR':8,'PA':19,'RI':4,'SC':9,'SD':3,
    'TN':11,'TX':40,'UT':6,'VT':3,'VA':13,'WA':12,'WV':4,'WI':10,'WY':3
  };

  const electionResults = {
    'CA': 'democrat','NY': 'democrat','TX': 'republican','FL': 'republican',
    'GA': 'lean-democrat','NC': 'lean-republican','AZ': 'lean-republican','NM': 'democrat',
    'CO': 'democrat','UT': 'republican','NV': 'lean-republican','ID': 'republican',
    'WA': 'democrat','OR': 'democrat','WY': 'republican','MT': 'republican',
    'OK': 'republican','AR': 'republican','LA': 'republican','MS': 'republican',
    'AL': 'republican','TN': 'republican','SC': 'republican','KY': 'republican',
    'VA': 'lean-democrat','WV': 'republican','MD': 'democrat','DE': 'democrat',
    'NJ': 'lean-democrat','PA': 'lean-republican','OH': 'republican','IN': 'republican',
    'IL': 'democrat','IA': 'republican','NE': 'lean-republican','SD': 'republican',
    'ND': 'republican','MN': 'democrat','WI': 'lean-republican','MI': 'lean-republican',
    'CT': 'democrat','RI': 'democrat','MA': 'democrat','VT': 'democrat',
    'NH': 'democrat','ME': 'lean-democrat','HI':'democrat','AK':'republican','KS':'republican','MO':'lean-republican'
  };

  const totals = { democrat:0, republican:0, undecided:0 };
  const totalVotes = Object.values(electoralVotes).reduce((a,b)=>a+b,0);

  const mapData = {};
  for(const state in electoralVotes){
    const party = electionResults[state] || 'undecided';
    const mainParty = party.replace('lean-','');
    if(mainParty!=='undecided') totals[mainParty] += electoralVotes[state];
    mapData[state] = { fillKey:party.toUpperCase(), votes:electoralVotes[state], party:party };
  }
  totals.undecided = totalVotes - totals.democrat - totals.republican;

  const tooltip = d3.select('body').append('div').attr('id','tooltip');

  const map = new Datamap({
    element: document.getElementById('map-container'),
    scope: 'usa',
    responsive:true,
    fills: { 
      'DEMOCRAT':'#2563eb',
      'REPUBLICAN':'#dc2626',
      'LEAN-DEMOCRAT':'#93c5fd',
      'LEAN-REPUBLICAN':'#fca5a5',
      'UNDECIDED':'#444',
      'defaultFill':'#222' 
    },
    data: mapData,
    geographyConfig:{
      borderColor:'#555',
      highlightFillColor:'#666',
      highlightBorderColor:'#fff',
      highlightBorderWidth:2,
      highlightOnHover:true,
      popupOnHover:false
    },
    done: function(datamap){
      // Add state abbreviations + EVs attached to each state's <g> element
      datamap.svg.selectAll('.datamaps-subunit')
        .each(function(geo){
          const state = geo.id;
          const centroid = datamap.path.centroid(geo);
          d3.select(this.parentNode) // attach text to same <g> as the state
            .append('text')
            .attr('x', centroid[0])
            .attr('y', centroid[1])
            .attr('text-anchor','middle')
            .attr('dy','0.35em')
            .attr('fill','#fff')
            .attr('font-size','10px')
            .attr('pointer-events','none')
            .text(`${state} (${electoralVotes[state]})`);
        });
    }
  });

  // Tooltip hover
  map.svg.selectAll('.datamaps-subunit')
    .on('mouseover', function(d){
      const state = d.id;
      const data = mapData[state];
      tooltip.style('display','block')
             .html(`<strong>${d.properties.name}</strong><br/>
                    Electoral Votes: ${data.votes}<br/>
                    Party: ${data.party.replace('lean-','').charAt(0).toUpperCase() +
                            data.party.replace('lean-','').slice(1)}${data.party.startsWith('lean-') ? ' (Lean)' : ''}`);
    })
    .on('mousemove', function(){
      tooltip.style('top', (d3.event.pageY + 15) + 'px')
             .style('left', (d3.event.pageX + 15) + 'px');
    })
    .on('mouseout', function(d){
      tooltip.style('display','none');
    });

  // Zoom & pan
  const zoom = d3.behavior.zoom()
    .scaleExtent([0.5,5])
    .on('zoom', ()=> map.svg.selectAll('g').attr('transform', `translate(${d3.event.translate})scale(${d3.event.scale})`));
  map.svg.call(zoom);

  // Update vote bars
  const demPercent = totals.democrat/538*100;
  const repPercent = totals.republican/538*100;
  document.getElementById('democrat-bar').style.width = demPercent + '%';
  document.getElementById('republican-bar').style.width = repPercent + '%';
});
