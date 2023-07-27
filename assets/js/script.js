/*==================== Input Copy Text ====================*/
let copyText1 = document.querySelector(".copy_txt1");
copyText1.querySelector("button").addEventListener("click", function(){
    let input = copyText1.querySelector("input.text");
    input.select();
    document.execCommand("copy");
    copyText1.classList.add("active");
    window.getSelection().removeAllRanges();
    setTimeout(function(){
        copyText1.classList.remove("active");
    },2500);
});

let copyText2 = document.querySelector(".copy_txt2");
copyText2.querySelector("button").addEventListener("click", function(){
    let input = copyText2.querySelector("input.text");
    input.select();
    document.execCommand("copy");
    copyText2.classList.add("active");
    window.getSelection().removeAllRanges();
    setTimeout(function(){
        copyText2.classList.remove("active");
    },2500);
});

let copyText3 = document.querySelector(".copy_txt3");
copyText3.querySelector("button").addEventListener("click", function(){
    let input = copyText3.querySelector("input.text");
    input.select();
    document.execCommand("copy");
    copyText3.classList.add("active");
    window.getSelection().removeAllRanges();
    setTimeout(function(){
        copyText3.classList.remove("active");
    },2500);
});

let copyText4 = document.querySelector(".copy_txt4");
copyText4.querySelector("button").addEventListener("click", function(){
    let input = copyText4.querySelector("input.text");
    input.select();
    document.execCommand("copy");
    copyText4.classList.add("active");
    window.getSelection().removeAllRanges();
    setTimeout(function(){
        copyText4.classList.remove("active");
    },2500);
});

let copyText5 = document.querySelector(".copy_txt5");
copyText5.querySelector("button").addEventListener("click", function(){
    let input = copyText5.querySelector("input.text");
    input.select();
    document.execCommand("copy");
    copyText5.classList.add("active");
    window.getSelection().removeAllRanges();
    setTimeout(function(){
        copyText5.classList.remove("active");
    },2500);
});

/*==================== Auto Sliding Carousel ====================*/
$(".services").owlCarousel({
    margin:20,
    loop:true,
    autoplay:true,
    autoplayTimeout:2000,
    autoplayHoverPause:true,
    responsive:{
      0:{
        items:1
      },
      600:{
        items:2
      },
      1000:{
        items:3
      }
    }
});