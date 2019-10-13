// Main page for front
/*data = d3.json("https://raw.githubusercontent.com/d3/d3-hierarchy/v1.1.8/test/data/flare.json", function (data) {
    chart(data);
});*/

d3.csv('./data/toulouse.csv').then(function (data) {
    const domains = ['ROBOTIQUE', 'VISION PAR ORDINATEUR', 'MACHINE LEARNING', 'DEEP LEARNING', 'SYSTEME DE RECOMMANDATION',
        'TRAITEMENT NATUREL DU LANGAGE', 'ETHIQUE', 'SYSTEME EXPERT', 'AUTRE'];

    let listOfDomains = [];

    domains.forEach(element => {
        let obj = { name: element, children: [] };
        listOfDomains.push(obj);
    });

    data.forEach(row => {
        //row.value = 3000;
        row.name = row.NOM;
        row.children = [{ name: "ici descriptif", value: 3000 }]
        domains.forEach(column => {
            if (row[column] !== "") {
                let result = listOfDomains.filter(obj => {
                    return obj.name === column
                });
                result[0].children.push(row);
            }
        });
    });
    let toulouseCompanies = { name: "Toulouse", children: listOfDomains };
    chart(toulouseCompanies);
});

chart = function (data) {
    console.log(data);
    let pack = data => d3.pack()
        .size([width, height])
        .padding(3)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));

    let height;
    let width = height = 932;
    let format = d3.format(",d");
    let color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    let circleColor = function(depth) {
      if(depth === 0) {
          return 'root'
      }

      if(depth === 1) {
          return 'children'
      }

      return 'baby'
    };

    const root = pack(data);
    console.log(root);
    let focus = root;
    let view;

    const svg = d3.select("body").append("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("margin", "0 -14px")
        .style("background", color(0))
        .style("cursor", "pointer")
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("class", d => circleColor(d.depth))
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function () {
            d3.select(this).attr("stroke", "#000");
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke", null);
        })
        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

    const label = svg.append("g")
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name)
        .style("font-weight", "bold");

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(d) {
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });

        label
            .filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) {
                if (d.parent === focus) this.style.display = "inline";
            })
            .on("end", function (d) {
                if (d.parent !== focus) this.style.display = "none";
            });
    }

    return svg.node();
};
