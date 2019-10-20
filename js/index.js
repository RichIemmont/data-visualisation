// Main page for front
/*data = d3.json("https://raw.githubusercontent.com/d3/d3-hierarchy/v1.1.8/test/data/flare.json", function (data) {
    chart(data);
});*/
const domains = ['ROBOTIQUE', 'VISION PAR ORDINATEUR', 'MACHINE LEARNING', 'DEEP LEARNING', 'SYSTEME DE RECOMMANDATION',
    'TRAITEMENT NATUREL DU LANGAGE', 'ETHIQUE', 'SYSTEME EXPERT', 'AUTRE'];

var focus;

d3.csv('./data/toulouse.csv').then(function (data) {
    let listOfDomains = [];

    domains.forEach(element => {
        let obj = { name: element, children: [] };
        listOfDomains.push(obj);
    });

    data.forEach(row => {
        row.name = row.NOM;
        row.value = row.Num;
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

    /*let lostOfBabyCircle = new Array;
    for (let index = 0; index < 9; index++) {
        lostOfBabyCircle.push(document.getElementsByClassName("baby-" + (index + 1)))
    }
    lostOfBabyCircle.forEach(item => {
        for (let index = 0; index < item.length; index++) {
            if (focus.parent === null)
                item[index].setAttribute("pointer-events", "none")
            else
                item[index].setAttribute("pointer-events", null)
        }
    });*/

});

chart = function (data) {
    let pack = data => d3.pack()
        .size([width, height])
        .padding(1)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));

    let height = window.innerHeight;
    let width = window.innerWidth;
    let format = d3.format(",d");
    let color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    let circleColor = function (d) {
        if (d.depth === 0) {
            return 'root'
        }

        if (d.depth === 1) {
            let cssId = domains.indexOf(d.data.name);
            return 'children-' + (cssId + 1);
        }

        if (d.depth === 2) {
            let cssId = domains.indexOf(d.parent.data.name);
            return 'baby-' + (cssId + 1);
        }

        let cssId = domains.indexOf(d.parent.parent.data.name);
        return 'mini-' + (cssId + 1);
    };

    const root = pack(data);
    focus = root;
    let view;

    const svg = d3.select("body").append("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("cursor", "pointer")
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("class", d => circleColor(d))
        .attr("pointer-events", d => null)
        .attr("stroke-width", "1px")
        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

    const label = svg.append("g")
        .style("font-size", "16px")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name)
        .style("font-weight", "lighter");

    const tag = companyText('TAG');
    const category = companyText('CATEGORIE');
    const employee = companyText('Num', " employé(s)");

    const link = svg.append("g")
        .style("font-size", "12px")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("a")
        .data(root.descendants().filter(obj => {
            return obj.depth === 2
        }))
        .join("a")
        .attr('href', d => d.data['Lien site web'])
        .attr('target', '_blank')
        .append('text')
        .style("pointer-events", "auto")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text('Plus d\'infos sur le site')
        .style("font-weight", "lighter");

    const image = svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("image")
        .data(root.descendants().filter(obj => {
            return obj.depth === 2
        }))
        .join("image")
        .attr('href', d => 'img/' + d.data['Logos'])
        .style('width', '80px')
        .style('height', '80px')
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none");

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
        const k = height / v[2];
        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k - 10})`);
        tag.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + 20})`);
        category.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + 40})`);
        employee.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + 60})`);
        link.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + 80})`);
        image.attr("transform", d => `translate(${(d.x - v[0]) * k - 40},${(d.y - v[1]) * k - 125})`);

        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function filterText(contentText, transition) {
        contentText.filter(function (d) {
            return d === focus || this.style.display === "inline";
        })
            .transition(transition)
            .style("fill-opacity", d => (d.parent === focus) || (d === focus && d.depth === 2) ? 1 : 0)
            .on("start", function (d) {
                if (d.depth === 2 && d === focus) this.style.display = "inline";
                else this.style.display = "none";
            })
            .on("end", function (d) {
                if (d.depth === 2 && d === focus) this.style.display = "inline";
                else this.style.display = "none";
            });
    }

    function companyText(columnName, additionalText = "") {
        return svg.append("g")
            .style("font-size", "15px")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants().filter(obj => {
                return obj.depth === 2
            }))
            .join("text")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === root ? "inline" : "none")
            .text(d => d.data[columnName] + additionalText)
            .style("font-weight", "lighter");
    }

    function zoom(d) {
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
            .style("fill-opacity", d => (d.parent === focus) || (d === focus && d.depth === 2) ? 1 : 0)
            .on("start", function (d) {
                if (d.depth === 2 && d === focus) {
                    this.style.display = "inline";
                }
                if (d.parent === focus) this.style.display = "inline";
            })
            .on("end", function (d) {
                if (d.depth === 2 && d === focus) this.style.display = "inline";
                else if (d.parent !== focus) this.style.display = "none";
            });

        filterText(tag, transition);
        filterText(category, transition);
        filterText(employee, transition);
        filterText(link, transition);
        filterText(image, transition);
    }

    return svg.node();
};
