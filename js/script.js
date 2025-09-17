// Copyright 2012 Feross Aboukhadijeh

// Cấu hình ảnh mặc định cho facebox
//$.facebox.settings.closeImage = "/hacks/fullscreen-api-attack/img/facebox/closelabel.png";
//$.facebox.settings.loadingImage = "/hacks/fullscreen-api-attack/img/facebox/loading.gif";

/* Hàm gọi Fullscreen API*/
function requestFullScreen() {
  const el = document.documentElement; // lấy phần tử gốc <html>
  if (el.requestFullscreen) {
    el.requestFullscreen(); // chuẩn mới
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT); // Chrome cũ, Safari
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen(); // Firefox cũ
  } else {
    console.warn("Trình duyệt không hỗ trợ Fullscreen API");
  }
}

/*
// Chuẩn bị âm thanh thất bại 
// Tạo sẵn đối tượng Audio (chỉ load, chưa phát)
const failSound = new Audio("sound/mario-death.mp3");

// Nếu file mp3 không phát được thì thử sang .ogg
failSound.onerror = function() {
  failSound.src = "sound/mario-death.ogg";
};

// Hàm phát âm thanh khi người dùng click
function playFailSound() {
  failSound.currentTime = 0; // tua lại từ đầu
  failSound.play().catch(err => {
    console.warn("Không thể phát âm thanh:", err);
  });
}*/

//Xử lý khi click vào vùng fake UI 
function handleSpoofClick(e) {
  // Nếu click xảy ra bên trong iframe thì bỏ qua
  if ($(e.target).closest("#spoofSite").length && e.target !== $("#spoofSite")[0]) {
    return;
  }
  // Phát âm thanh và hiện popup "phished"
  playFailSound();
  $("#spoofHeader").stop().effect("shake", function () {
    $.facebox({ div: "#phished" });
  });
}

//Khi DOM đã sẵn sàng
$(function () {
  // Preload các ảnh trong #spoofSite để hiển thị nhanh hơn
  $("#spoofSite img").each(function (_, img) {
    new Image().src = img.src;
  });

  // Mảng lưu thông báo lỗi
  var errors = [];

  // Kiểm tra hỗ trợ Fullscreen API
  if (window.fullscreenSupport) {
    // Xác định trình duyệt
    const b = BrowserDetect.browser;
    $("html").addClass(
      b === "Chrome" ? "chrome" :
      b === "Firefox" ? "firefox" :
      b === "Safari" ? "safari" : "chrome" // fallback Chrome
    );
    if (b !== "Chrome" && b !== "Firefox" && b !== "Safari") {
      errors.push("Trình duyệt của bạn hỗ trợ Fullscreen API nhưng chưa được hỗ trợ khi viết demo. <b>Demo vẫn chạy</b> nhưng giao diện sẽ giả lập Chrome.");
    }

    // Xác định hệ điều hành
    const os = BrowserDetect.OS;
    $("html").addClass(
      os === "Mac" ? "osx" :
      os === "Windows" ? "windows" :
      os === "Linux" ? "linux" : ""
    );
    if (os !== "Mac" && os !== "Windows" && os !== "Linux") {
      errors.push("Hệ điều hành không hỗ trợ. <b>Demo sẽ không chạy được.</b>");
    }
  } else {
    errors.push("Trình duyệt của bạn không hỗ trợ Fullscreen API. Hãy thử Chrome, Firefox hoặc Safari 6+.");
  }

  // Ghép chuỗi lỗi
  const errorStr = errors.join("<br><br>");

  //Lắng nghe sự kiện thay đổi fullscreen 
  $(document).on("fullscreenchange", function () {
    if (document.fullscreenElement) {
      $("html").addClass("fullscreened").removeClass("not-fullscreened");
    } else {
      $("html").addClass("not-fullscreened").removeClass("fullscreened");
      $("html").off("click.spoof"); // bỏ sự kiện giả lập khi thoát fullscreen
    }
  }).trigger("fullscreenchange");

  //Khi click vào link .spoofLink
  $("html").on("click", ".spoofLink", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Nếu không hỗ trợ fullscreen thì báo lỗi
    if (!window.fullscreenSupport) {
      $.facebox(errorStr);
      return;
    }

    // Gọi fullscreen
    requestFullScreen();

    // Hiển thị fake site
    $("#spoofSite").show();

    // Khi iframe Netflix load xong
    $("#netflixFrame").on("load", function () {
      var iframeDoc = this.contentDocument || this.contentWindow.document;
      // Bất kỳ click nào trong iframe → hiện thông tin nhóm
      $(iframeDoc).on("click", function () {
        showGroupInfo();
        return false;
      });
    });

    // Khi click vào fake UI → gọi handleSpoofClick
    $("html").on("click.spoof", handleSpoofClick);

    // Cho phép click truyền xuống iframe
    $("#spoofSite").on("click", () => true);
  });
});
