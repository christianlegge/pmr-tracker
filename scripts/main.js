const maxKeyCounts = {
    1: 4, // fortress keys
    2: 4, // ruins keys
    3: 3, // tubba keys
    4: 160, // star pieces
    5: 11, // rip cheato
    6: 26, // letters
    7: 2, // prison keys
    8: 5, // bowser castle keys
    9: 64, // quizmo
    10: 3 // master
};

var currentKeyCounts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0
};

function localStorageGetWithDefault(key, defaultValue) {
    const value = localStorage.getItem(key);
    if (!value) {
        localStorage.setItem(key, defaultValue);
        return defaultValue;
    }
    return value;
}

$(document).ready(function(){
    // disable some basic functionality
    $('img').on('dragstart', function(){return false;});
    $('html').contextmenu(function(){return false;});
    $('img').contextmenu(function(){return false;});

    $('.star-spirit').height(60);
    $('.partner, .upgrade').height(60);
    $('.key-item, .optional-item').height(40);

    $('.partner, .optional-item, .upgrade').click(function() {
        if ($(this).hasClass("unselected")) {
            $(this).removeClass("unselected");
        } else {
            $(this).addClass("unselected");
        }
    });

    // set text display for the main items
    $('.main-tracker img').on('mouseenter', function() {
        $('#main-name-field').text($(this).attr('id'));
    });

    $('.main-tracker img').on('mouseleave', function() {
        $('#main-name-field').text("");
    });

    // misc tracker
    $('.misc-tracker img').on('mouseenter', function() {
        $('#misc-name-field').text($(this).attr('id'));
    });

    $('.misc-tracker img').on('mouseleave', function() {
        $('#misc-name-field').text("");
    });

    // koopa koot block names
    $('.koopa-koot-tracker img').on('mouseenter', function() {
        $('#secondary-name-field').text($(this).attr('id'));
    });

    $('.koopa-koot-tracker img').on('mouseleave', function() {
        $('#secondary-name-field').text("");
    });

    // add all the tracker hooks for clicking on images
    for (var i = 1; i <= 10; ++i) {
        // required chapter items
        $(`*[data-chapter="${i}"]`).click(function(){
            var c = parseInt($(this).attr("data-chapter"));
            if ($(this).hasClass("unselected")) {
                $(this).removeClass("unselected");
            } else {
                $(this).addClass("unselected");
            }
        });

        // chapter keys
        $(`*[data-chapter-key="${i}"]`).click(function(){
            var c = parseInt($(this).attr("data-chapter-key"));
            $(this).removeClass("unselected");
            if (currentKeyCounts[c] < maxKeyCounts[c]) {
                ++currentKeyCounts[c];
                $(`#chapter-${c}-key-count`).text(`${currentKeyCounts[c]}/${maxKeyCounts[c]}`);
            }
        });

        $(`*[data-chapter-key="${i}"]`).contextmenu(function(){
            var c = parseInt($(this).attr("data-chapter-key"));
            if (currentKeyCounts[c] > 0) {
                --currentKeyCounts[c];
                $(`#chapter-${c}-key-count`).text(`${currentKeyCounts[c]}/${maxKeyCounts[c]}`);
            }

            if (currentKeyCounts[c] === 0) {
                $(this).addClass("unselected");
            }

            return false;
        });

        // star spirit trackers
        $(`#chapter_${i}`).click(function(){
            if ($(this).hasClass("unselected")) {
                $(this).removeClass("unselected");
            } else {
                $(this).addClass("unselected");
            }
        });
    }

    // options menu
    $("#options-menu-toggle").click(function() {
        $(this).toggleClass("options-open");
        $("#options-menu").toggleClass("options-open");
    });

    $("#chapter-6-open").click(function() {
        var isChecked = $(this).is(':checked');
        $(".ch6-optional").toggle(!isChecked);
        localStorage.setItem("chapter-6-open", isChecked);
    });

    $("#blue-house-open").click(function() {
        var isChecked = $(this).is(':checked');
        $(".blue-house-optional").toggle(!isChecked);
        localStorage.setItem("blue-house-open", isChecked);
    });

    $("#koopa-koot-randomized").click(function() {
        var isChecked = $(this).is(':checked');
        $(".koopa-koot-tracker").toggle(isChecked);
        localStorage.setItem("koopa-koot-randomized", isChecked);
    });

    // local storage settings
    var chapter6_open = localStorageGetWithDefault("chapter-6-open", false) == "true";
    if (chapter6_open) {
        $("#chapter-6-open").click();
    }

    var blue_house_open = localStorageGetWithDefault("blue-house-open", false) == "true";
    if (blue_house_open) {
        $("#blue-house-open").click();
    }

    var koopa_koot_randomized = localStorageGetWithDefault("koopa-koot-randomized", true) == "true";
    if (!koopa_koot_randomized) {
        $("#koopa-koot-randomized").click();
    }
});
