// Datepicker
$('.fc-datepicker').datepicker({
    showOtherMonths: true,
    selectOtherMonths: true
});

$('[data-toggle="tooltip"]').tooltip()

// $('#company-profile-update').steps({
//     headerTag: 'h3',
//     bodyTag: 'section',
//     autoFocus: false,
//     titleTemplate: '<span class="number">#index#</span> <span class="title">#title#</span>',
//     stepsOrientation: 1,
//     enableAllSteps: true
// });

$('#company-profile-update').find('.add-pf').click(function () {
    $('.from-pf').show();
});

$('#company-profile-update').find('.form-close-pf').click(function () {
    $('.from-pf').hide();
});

$('#company-profile-update').find('.add_establishment').click(function () {
    $('.from_establishment').toggle();
});

$('#company-profile-update').find(".add_establishmentdetails").click(function () {
    // $(".from_establishmentdetails").toggle();
});

$('#company-profile-update').find(".add_regofficeadd").click(function () {
    $(".from_regofficeadd").toggle();
});

$('#company-profile-update').find(".add_commofficeadd").click(function () {
    $(".from_commofficeadd").toggle();
});

$('#company-profile-update').find(".add_esic").click(function () {
    $(".from_esic").toggle();
});

$('#company-profile-update').find(".add_protax").click(function () {
    $(".from_protax").toggle();
});

$('#company-profile-update').find(".add_combrde").click(function () {
    $(".from_combrde").toggle();
});

$('#company-profile-update').find(".add_prefsetting").click(function () {
    $(".from_prefsetting").toggle();
});

$('#company-profile-update').find(".add_costcenter").click(function () {
    $(".from_costcenter").toggle();
});

$('#company-profile-update').find(".add_csmu").click(function () {
    $(".from_csmu").toggle();
});

// // Toggles
// $('.br-toggle').on('click', function(e) {
//     e.preventDefault();
//     $(this).toggleClass('on');
// });


$(document).ready(function () {
    $('.template-details').find('a[tabnav]').bind('click', function (e) {
        e.preventDefault(); // prevent hard jump, the default behavior

        var target = $(this).attr("data-target"); // Set the target as variable

        // perform animated scrolling by getting top-position of target-element and set it as scroll target
        let $element = document.querySelectorAll(target);
        if ($element.length > 0) {
            const firstErr = $element[0];
            firstErr.scrollIntoView({ behavior: 'smooth' });
        }

        return false;
    });
});

$('.template-details').find('.template-tables').scroll(function () {
    var scrollDistance = $('.template-details').scrollTop();

    // Assign active class to nav links while scolling
    $('.template-details').find('.templete-item').each(function (i) {
        if ($(this).position().top <= scrollDistance) {
            $('.template-details').find('.nav-item a.active').removeClass('active');
            $('.template-details').find('.nav-item a').eq(i).addClass('active');
        }
    });
}).scroll();