/** @format */

$(document).ready(function () {
    "use strict";

    readJsonFile("data/menumodel.json");

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
    }

    function printLevel1(data) {
        $.each(data, function (index, menuItem) {
            let item = JSON.stringify(menuItem);
            let encodedItem = encodeURIComponent(item);
            let link = `<td onclick="printLevel2('${encodedItem}')" class="topnavigation">${menuItem.title}</td>`;
            $("#level1").append(link);
        });
    }

    this.printLevel2 = function (item) {
        $("#level2").empty();

        let decodedItem = decodeURIComponent(item);
        let jsonItem = JSON.parse(decodedItem);

        $("#level2").append(`<h4 class="teste">${jsonItem.title}</h4>`);

        $.each(jsonItem.childrens, function (idx, menuItem) {
            if (menuItem.url) {
                let link = `<div onclick="location.href='${menuItem.url}'" class="horizontal-menu-item">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th scope="col" class="tableTitle">Nome</th>
                                    <th scope="col" class="tableTitle">Descrição</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td scope="row" class="name">${menuItem.title}</td>
                                    <td scope="row" class"description">${menuItem.description}</td>
                                </tr>   
                            </tbody>
                        </table>
                    </div>`;
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

    document.getElementById("backButton").addEventListener("click", function () {
        window.history.back();
    });
});
