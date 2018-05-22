/*global $ Image*/
/*jslint this: true */

class SlideDate {
    constructor(date, dayName, primaryColor, accentColor) {
        this.date = date;
        this.dayName = dayName;
        this.primaryColor = primaryColor;
        this.accentColor = accentColor;
        this.dateString = moment(date, "YYYY-MM-DD").format("dddd, MMMM Do");
    }
}

var background;
function loadBackground(src, callback) {
    "use strict";
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
        background = img;
        callback();
    };
    img.src = src;
}


function makeSlide(day, weekdays) {
    "use strict";
    var ctx = $("#edit-canvas")[0].getContext("2d");
    var width = 1920, height = 1080, division = width * 0.72;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    //Drawn image and darken
    ctx.drawImage(background, 0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, width, height);
    //Draw rectangle
    ctx.fillStyle = day.primaryColor;
    ctx.fillRect(0, 0, division, height);
    ctx.fillStyle = day.accentColor;
    //Write A/B day
    ctx.font = "bold 295px Arial";
    ctx.fillText(day.dayName, 20, 250);
    //Write date
    ctx.font = "bold 90px Arial";
    ctx.fillText(day.dateString, 30, 390);
    //Write weekdays
    var drawHeight = height - 40;
    weekdays.reverse().forEach(function (weekday) {
        //Write day name
        ctx.fillStyle = day.accentColor;
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "end";
        ctx.fillText(weekday.dayName, division - 20, drawHeight);
        //Write date
        ctx.fillStyle = day.primaryColor;
        ctx.font = "normal 40px Arial";
        ctx.textAlign = "start";
        ctx.fillText(weekday.dateString, division + 20, drawHeight);
        drawHeight -= 55;
    });
    return {name:day.date, image:ctx.canvas.toDataURL().slice(22)};
}

function makeZip(slides) {
    "use strict";
    var zip = new JSZip();
    slides.forEach(function (slide) {
        zip.file(slide.name + ".png", slide.image, {base64: true});
    });
    zip.generateAsync({type:"blob"}).then(function (content) {
        saveAs(content, "slides.zip");
    });
}

function toast(message, duration) {
    "use strict";
    var toaster = $(".toast");
    toaster.text(message);
    $(".toast").removeClass("show");
    $(".toast").addClass("show");
    setTimeout(function() {
        $(".toast").removeClass("show");
    }, duration);
}

$(document).ready(function () {
    $(":file").change(function () {
        var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        $("[data-file-display=" + this.id + "]").val(label);
    })
    loadBackground("https://lh3.googleusercontent.com/-mxxjgapBiMs/WwNSrX2HRbI/AAAAAAABu84/ryiIsUjIQhUPDKUfVgyaQFAHR3AGDpooACHMYCw/s0/aphs.jpg", function () {
        "use strict";
        //Give an example
        makeSlide(
            new SlideDate(moment().format("YYYY-MM-DD"), "A Day", "cornflowerblue", "white"), 
            [new SlideDate(moment().add(1, "days").format("YYYY-MM-DD"), "B Day"),
            new SlideDate(moment().add(2, "days").format("YYYY-MM-DD"), "A Day"),
            new SlideDate(moment().add(3, "days").format("YYYY-MM-DD"), "B Day"),
            new SlideDate(moment().add(4, "days").format("YYYY-MM-DD"), "A Day"),
            new SlideDate(moment().add(5, "days").format("YYYY-MM-DD"), "B Day")
            ]
        );
    });

    $("#csv").change(function () {
        $("#csv").parse({
            config: {
                skipEmptyLines: true,
                fastMode: true,
                complete: function(results, file) {
                    toast("Started making slides, please wait...", 2000);
                    var slidesData = [];
                    results.data.forEach(function(value) {
                        var date = value[0];
                        var dayText = value[1];
                        var primaryColor = value[2];
                        var accentColor = value[3];
                        if (dayText == "A") { primaryColor = "cornflowerblue"; } else if (dayText == "B") { primaryColor = "yellow"; }
                        if (dayText == "A") { accentColor = "white"; } else if (dayText == "B") { accentColor = "black"; }
                        if (dayText == "A") { dayText = "A Day"; } else if (dayText == "B") { dayText = "B Day"; }
                        slidesData.push(new SlideDate(date, dayText, primaryColor, accentColor));
                    })
                    var slideNumber = 0;
                    var slidesTotal = slidesData.length;
                    var progressBar = $("#make-progress .progress-bar");
                    var chunk = 5;
                    var slideImages = [];
                    for (var i = 0; i < slidesTotal; i += chunk) {
                        week = slidesData.slice(i, i + chunk);
                        week.forEach(function (day) {
                            slideImages.push(makeSlide(day, week));
                            slideNumber++;
                            progressBar.text(slideNumber + "/" + slidesTotal);
                            progressBar.width(slideNumber / slidesTotal * 100 + "%");
                        });
                    }
                    makeZip(slideImages);
                    toast("Finished making slides, downloading as .zip file..", 2000);
                },
                error: function(err, file, inputElem, reason) {
                    toast("Error reading .csv file!", 2000)
                }
            }
        });
    })
})

