var width=1000;
var height=800;
var color = d3.scale.category10();

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

function getRadius(rank){
  return 20 + Math.exp(6 - rank) * 0.2;
}

var scaleRadius = d3.scale.log()
                    .domain([1,6])
                    .range([100,15]);
var scaleFont = d3.scale.log()
                    .domain([1,6])
                    .range([2.5,0.5]);
var scaleLength = d3.scale.log()
                    .domain([1,30])
                    .range([1.1,0.7]);


var force = d3.layout.force()
    .gravity(.05)
    .charge(-200)
    .size([width, height]);

queue()
  .defer(d3.csv, "data/nodes1.csv", function(d){
    return {
      index: +d.index,
      id: d.id, // convert "Year" column to Date
      text: d.name,
      group: d.group,
      rank: +d.rank // convert "Length" column to number
    };
  })
  .defer(d3.csv, "data/links.csv", function(d){
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

  var insertLinebreaks = function (t, text, rank) {
      var width = getRadius(rank)*1.75;
      var fsize = scaleFont(rank+1) *scaleLength(text.length);//Math.log(getRadius(rank)) // (Math.exp(text.length * 0.001));
      var el = d3.select(t);
      var p = d3.select(t.parentNode);
      //console.log(fsize);
      p.append("foreignObject")
          .attr('x', -width/2)
          .attr('y', -width/2)
          .attr("width", width)
          .attr("height", width)
        // .append("xhtml:container")
        //   .attr('style',  'position:absolute;')
          .append("xhtml:div")
            .attr('style',   ' min-height: '+ width+'px; display: flex; align-items: center; justify-content: center; vertical-align: middle; text-align: center; word-wrap: normal; fill :#fff;  font-size:' + fsize + 'em;')
            .html(text);    
              //position:absolute; margin-right:-50%; left:50%; top:50%; transform: translate(-50%, -50%);
      //el.remove(); 

  };

  // var edges = [];
  // console.log(edges);
  // linksJson.forEach(function(e) { 
  //   var sourceNode = nodesJson.filter(function(n) { return n.id === e.source; })[0],
  //       targetNode = nodesJson.filter(function(n) { return n.id === e.target; })[0];
  //   //console.log(targetNode);
  //   edges.push({source: sourceNode, target: targetNode, value: e.value});
  // });
   
  // console.log(nodesJson);

  // add nodes to force
  force
    .nodes((nodesJson))
    .links((linksJson));

  var link = svg.selectAll(".link")
    .data(force.links())
    .enter().append("line")
    .attr("class", "link");

  var node = svg.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", "node")
    .style("fill", function(d) {
      return color(d.group); 
    })
    .style("opacity", 0.9)
    //.on("mouseover", mouseover)
    //.on("mouseout", mouseout)
    .call(force.drag);

  node.append("circle")
    .attr("r", function(d) { 
      return scaleRadius(d.rank+1);//getRadius(d.rank);
    })
    .each(function(d,i){ insertLinebreaks(this, d.text, d.rank); });

  var bounds = {
      x: 0, // bounding box is 300 pixels from the left
      y: 0, // bounding box is 400 pixels from the top
      width: 100, // bounding box is 500 pixels across
      height: 100 // bounding box is 600 pixels tall
  };

  // fObjects = node.append("foreignObject")
  //   .attr("x", function(d){d.x});
  // console.log(fObjects);


  
  // node.append("svg:text")
  //   .attr("class", "nodetext")
  //   .attr("text-anchor", "middle")
  //   .attr("dx", 0)
  //   .attr("dy", "0.35em")
  //   .style("font-size", function(d) { 
  //     var ts = getRadius(d.rank)*0.5 - (Math.exp(d.text.length*0.001));
  //     //console.log(ts);
  //     return ts + "px";
  //   })
  //   .style("fill", "#000")
  //   .text(function(d) { return d.text })
    
    /*.textwrap(function(d){
      var bounds={x:d.x-d.r, y:d.y-d.r, width:d.r*2, height:d.r*2};
      console.log(bounds);
      return bounds;    // function(d) {
    //    return (getRadius(d.rank) * 2)-100;
    // });
    });*/
    //.call(wrap, 100);
    //function(d) {
    //   console.log(d);
    //    return (getRadius(d.rank) * 2)-100;
    // });

    //d3.select('text').textwrap(bounds);//function(d) {
    //   console.log(d);
    //   //console.log(i);
    //   // var bounds={x:d.x-d.r, y:d.y-d.r, width:d.r*2, height:d.r*2};
    //   console.log(bounds);
    //   return bounds;
    //     // code to dynamically determine bounds
    //     // for each text node goes here
    // });


  var padding = 1; // separation between circles
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(force.nodes);
    console.log(quadtree);
    return function(d) {
      var radius = scaleRadius(d.rank);
      var rb = 2*radius + padding,
          nx1 = d.x - rb,
          nx2 = d.x + rb,
          ny1 = d.y - rb,
          ny2 = d.y + rb;
          debugger;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y);
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

  function tick() {
    link.attr("x1", function (d) {
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
        
        node.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
            return d.y;
        });
        node.each(collide(0.5)); 
  }



  function wrap(text, width) {
    
    text.each(function() {
      
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 0.5, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy"));
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

      while (word = words.pop()) {
        console.log(word);
        line.push(word);
        console.log(line);
        tspan.text(line.join(" "));
        //console.log(tspan.node().getComputedTextLength());
        //console.log(width);
        if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        // if(line.length > 1) 
          
          line.pop(); 
          tspan.text(line.join(" "));
          line = [word];
          console.log(++lineNumber);

          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }


  force
    .linkDistance(function(d){
      //console.log((d.source.rank));
      //console.log(getRadius(d.source.rank));
      return (getRadius(d.source.rank) +
              getRadius(d.target.rank) +
              (d.value-1) * 20)
    })
    .on("tick", tick)
    .start();
 
}





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
      .attr("xlink:href", function(d){return d.Url;})
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