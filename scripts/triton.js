$(document).ready(function () {
	"use strict";

	readJsonFile("data/menumodel.json");

    var stackBC = [];

	function readJsonFile(filePath) {
		$.ajax({
			url: filePath,
			dataType: "json",
			success: function (data) {
				printLevel1(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error("Error reading JSON file:", textStatus, errorThrown);
			},
		});
	};

	function printLevel1(data) {
		$.each(data, function (index, menuItem) {
			let item = JSON.stringify(menuItem);
			let encodedItem = encodeURIComponent(item);
			let link = `<span class="topNavigationText pointer" onclick="prePrintLevel2('${encodedItem}')" >${menuItem.title}</span>`;
			$("#level1").append(link);
		});
	};

    this.prePrintLevel2 = function(item) {
        stackBC = [];
        let bcItem = "Home";
        stackBC.push(bcItem);
        
        let decodedItem = decodeURIComponent(item);
		let jsonItem = JSON.parse(decodedItem);

        this.printLevel2(item);
    };

	this.printLevel2 = function(item) {
		$("#level2").empty();

		let decodedItem = decodeURIComponent(item);
		let jsonItem = JSON.parse(decodedItem);
        
        let bcItem = " > ";
        stackBC.push(bcItem);

        bcItem = jsonItem.title;
        stackBC.push(bcItem);

        $("#breadcrumb").empty();
        $.each(stackBC, function(index, bcItem) {
            $("#breadcrumb").append(bcItem);
        })

		$("#level2").append(`<h4 class="pageTitle">${jsonItem.title}</h4>`);

		$.each(jsonItem.childrens, function (idx, menuItem) {
			if (menuItem.url) {
				let link = `
                        <table class="contentTable">
                            <tbody>
                                <div class="tableBackground">
                                <tr>
                                    <td scope="row" class="name"><div onclick="location.href='${menuItem.url}'" class="horizontal-menu-item">${menuItem.title}</div></td>
                                    <td scope="row" class"description">${menuItem.description}</td>
                                </tr>  
                                </div> 
                            </tbody>
                        </table>
                    `;
				$("#level2").append(link);
			}

			if (menuItem.childrens && menuItem.childrens.length) {
				let item = JSON.stringify(menuItem);
				let encodedItem = encodeURIComponent(item);
				let link = `<div onclick="printLevel2('${encodedItem}')" class="itemList">${menuItem.title}</div>`;
				$("#level2").append(link);
			}
		});
	};
});
