var wWidth =document.documentElement.clientWidth,
	  wHeight=document.documentElement.clientHeight-20;
var fixWidth = 1200,
	fixHeight= fixWidth*(wHeight/wWidth);


var svg = d3.select("body")
   .append("svg:svg")
      .classed("svg-content-responsive", true)
      // aspect acording to window, widthFixed for the viewbox  scaling
      .attr("viewBox", "0 0 " + fixWidth + " " + fixHeight)
      .attr("preserveAspectRatio", "xMaxYMin meet")
      .attr("pointer-events", "all");
  // /  .call(d3.behavior.zoom().on("zoom", resize));

var scaleRadius = d3.scale.log()
                    .domain([1,6])
                    .range([100,15]);
var scaleFont = d3.scale.log()
                    .domain([1,6])
                    .range([85,10]);
var scaleLength = d3.scale.log()
                    .domain([1,20])
                    .range([1,0.15]);

var color = d3.scale.category10();

var force = d3.layout.force()
    .gravity(.05)
    .charge(-100)
    .linkStrength(0.3)
    .friction(0.9)
    .on("tick", tick)
    .size([fixWidth, fixHeight]);

 var  link, 
      node,
      nodetext;

function resize() {
  wWidth = window.innerWidth, 
  wHeight = window.innerHeight-20;
  fixHeight= fixWidth*(wHeight/wWidth);
  svg.attr("viewBox", "0 0 " + fixWidth + " " +fixHeight);
  force.size([fixWidth,fixHeight]);
}
d3.select(window).on("resize", resize);


queue()
  .defer(d3.csv, "data/nodes1.csv", function(d){
    return {
      index: +d.index,
      id: d.id, // convert "Year" column to Date
      text: d.name,
      group: d.group,
      rank: +d.rank,// convert "Length" column to number
      visible: Boolean(+d.visible >0)
    };
  })
  .defer(d3.csv, "data/links2.csv", function(d){
    return {
      source: d.source, // convert "Year" column to Date
      target: d.target,
      value: +d.value
    };
  })
//  .defer(d3.csv, "links.csv")
  .await(ready);
//Main function

function ready(error, nodesJson, linksJson) {
  
    // map of node ids
  var nodeMap = {};
  nodesJson.forEach(function(x) {
    nodeMap[x.id] = x; 
  });

  // reference to nodes in link id
  linksJson = linksJson.map(function(x) {
    return {
      source: nodeMap[x.source],
      target: nodeMap[x.target],
      value: x.value
    };
  });
  // save all connections in an array
  var linkedById = {};
  for (i = 0; i < nodesJson.length; i++) {
    linkedById[i + "," + i] = -1;
  };
  linksJson.forEach(function (d, i) {
    linkedById[d.source.id + "," + d.target.id] = i;
  



  });
  //console.log(linkedById);
  //This function looks up whether a pair are neighbours
  function neighboring(a, b) {
       return linkedById[a.id + "," + b.id];
  }

  var visibleNodes = [nodesJson[0]];
  var visibleLinks = [];
  // nodesJson.forEach(function(n){
  //   console.log(n);
  //   if (n.visible) visibleNodes.push(o);
  // })


  function update(){
    force
      .nodes(visibleNodes)
      .links(visibleLinks)      
      .start();
  console.log(force.nodes());

  link = svg.selectAll(".link")
      .data(visibleLinks, function(d) { return d.target.id; });
      //.enter().append("line")
  link.exit().remove();
  link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  console.log(linksJson);

  node = svg.selectAll(".node")
      .data(force.nodes(), function(d) { return d.id; });
  node.exit().remove();
  node.enter().append("g")
      .attr("class", "node")
      // .attr("cx", function(d) { return d.x; })
      // .attr("cy", function(d) { return d.y; })
      .style("fill", function(d) {
        return color(d.group); 
      })
      .style("opacity", function(d){return 1-(d.rank*0.1)})
      .call(force.drag)
      .append("circle")
        .attr("r", function(d) { 
          return scaleRadius(d.rank);
        })
        .each(function(d,i){insertTextDivs(this, d.text, d.rank); });
        //.on("mouseout", mouseout)
        

      console.log(node);


        
  nodetext = svg.selectAll(".nodetext")
    .on("mouseover", mouseover)
    .on("dblclick", dblclick)
    .on("click", mouseclick)
    .on("mouseout", mouseout);
    

    force
      .linkDistance(function(d){
        return (scaleRadius(d.source.rank ) +
                scaleRadius(d.target.rank ) +
                (d.value-1) * 20);
      })
   }

   update();
  //resize;

  // make  neigbours visible 
  function mouseclick(d){
    if (d3.event.defaultPrevented) return; 
    console.log(d);
    nodesJson.forEach(function(n){
      if (neighboring(d,n)>-1 & !n.visible){
        console.log(n.id);
        console.log(neighboring(d,n));
        console.log(linksJson[neighboring(d,n)]);
        n.visible = true;
        visibleNodes.push(n);
        visibleLinks.push(linksJson[neighboring(d,n)]);
      } 
    });
    update();
  }

  function dblclick(d){
    if (d3.event.defaultPrevented) return; 
    var visibleNodes = [nodesJson[0]];
    var visibleLinks = [];
    update();
  }



  function mouseover(d){
    //console.log(d.id);
  }
  function mouseover(d){
    //console.log(d.id);
  }



}
// prevent collision  
var padding = 1; // separation between circles
function collide(alpha) {
  var quadtree = d3.geom.quadtree(force.nodes());
   return function(d) {
    var radius = scaleRadius(d.rank),
        nx1 = d.x - radius,
        nx2 = d.x + radius,
        ny1 = d.y - radius,
        ny2 = d.y + radius;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
            rb = radius + scaleRadius(quad.point.rank) + padding;
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

// force layout tick
function tick() {
  link
    .attr("x1", function (d) {
      return d.source.x;
    })
    .attr("y1", function (d) {
      return d.source.y;
    })
    .attr("x2", function (d) {
      return d.target.x;
    })
    .attr("y2", function (d) {
      return d.target.y;
    });
      
  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  node.each(collide(0.5)); 
}

// for finding the longest word
function longerString(champ, contender){
      return (contender.length > champ.length) ? contender: champ;
}
// inserting text as foreignObjects (HTML)  
function insertTextDivs(t, text, rank) {
    var width = scaleRadius(rank)*1.95;
    var maxWordLength = text.split(" ").reduce(longerString).length;
    var fsize = scaleFont(rank) *scaleLength(maxWordLength);
    var el = d3.select(t);
    var p = d3.select(t.parentNode);
    p.append("foreignObject")
        .attr('x', -width/2)
        .attr('y', -width/2)
        .attr("width", width)
        .attr("height", width)
      // .append("xhtml:container")
      //   .attr('style',  'position:absolute;')
        .append("xhtml:div")
          .attr('class', 'nodetext')
          .attr('style', 'min-height: '+ width+'px; font-size:' + fsize + 'px;')
          .html(text);    
            //position:absolute; margin-right:-50%; left:50%; top:50%; transform: translate(-50%, -50%);
}
// not used, maybe for zooming?
// function redraw() {
//   vis.attr("transform",
//       "translate(" + d3.event.translate + ")"
//       + " scale(" + d3.event.scale + ")");
// }



/*d3.json("example.json", function(error, json) {
  var edges = [];
    json.Links.forEach(function(e) { 
    var sourceNode = json.Nodes.filter(function(n) { return n.Id === e.Source; })[0],
    targetNode = json.Nodes.filter(function(n) { return n.Id === e.Target; })[0];
    	
    edges.push({source: sourceNode, target: targetNode, value: e.Value});
    });
    
  force
      .nodes(json.Nodes)
      .links(edges)
      .start();

  var link = svg.selectAll(".link")
      .data(edges)
    .enter().append("line")
      .attr("class", "link");

  var node = svg.selectAll(".node")
      .data(json.Nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("circle")
      .attr("class", "node")
      .attr("r", 5);

  node.append("svg:a")
      .attr("xlink:href", hfunction(d){return d.Url;})
      .append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.Name})

  
  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
});*/

/* from R:
var color = d3.scale.category20();

var force = d3.layout.force()
.nodes(d3.values(nodes))
.links(links)
.size([width, height])
.linkDistance(function(d){return 10- Math.sqrt(d.value)})
.charge(-100)
.on("tick", tick)
.start();

var link = svg.selectAll(".link")
.data(force.links())
.enter().append("line")
.attr("class", "link")
.style("stroke-width", function(d) { return Math.sqrt(d.value); });

var node = svg.selectAll(".node")
.data(force.nodes())
.enter().append("g")
.attr("class", "node")
.style("fill", function(d) { return color(d.group); })
.style("opacity", 0.4)
.on("mouseover", mouseover)
.on("mouseout", mouseout)
.call(force.drag);

node.append("circle")
.attr("r", 6)

node.append("svg:text")
.attr("class", "nodetext")
.attr("dx", 12)
.attr("dy", ".35em")
.text(function(d) { return d.name });

function tick() {
link
.attr("x1", function(d) { return d.source.x; })
.attr("y1", function(d) { return d.source.y; })
.attr("x2", function(d) { return d.target.x; })
.attr("y2", function(d) { return d.target.y; });

node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function mouseover() {
d3.select(this).select("circle").transition()
.duration(750)
.attr("r", 16);
d3.select(this).select("text").transition()
.duration(750)
.attr("x", 13)
.style("stroke-width", ".5px")
.style("font", "17.5px serif")
.style("opacity", 1);
}

function mouseout() {
d3.select(this).select("circle").transition()
.duration(750)
.attr("r", 8);
}
*/