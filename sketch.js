// sketch.js
let cam;
let camFrame;
let camReady = false;
let usingFrontCamera = true;

let snapshots = [];
let startX, startY;
let selecting = false;
let shapeType = "rect";
let borderColor = "none";

let gridSize = 6;
let gridSnaps = [];
let cellW, cellH;

let longPressStartTime = 0;
let longPressThreshold = 500; // 毫秒
let pressedSnap = null;

let drawingMode = false;
let currentLine = [];
let drawnLines = [];

let a4BackgroundImg; // A4 背景 PNG


function preload() {
  a4BackgroundImg = loadImage("a4_background.png"); // 你的A4背景图文件名
}



let mode = "free";

function setup() {
  adjustCanvasSize(); // 👉 初次设置 canvas 尺寸

  const canvas = createCanvas(640, 480);
  canvas.parent("canvas-container");

  cellW = width / gridSize;
  cellH = height / gridSize;

  setupButtons();

  const startBtn = select("#startCameraBtn");
  if (startBtn) {
    makeTouchable(startBtn).mousePressed(() => {
      startBtn.attribute("disabled", "true");
      setCameraStatus("正在请求摄像头权限…");
      startCamera();
    });
  }

  for (let i = 0; i < gridSize * gridSize; i++) {
    gridSnaps.push(null);
  }

  textAlign(CENTER, CENTER);
  updateModeVisibility();

  resizeCanvasForOrientation();

  // 保存草稿
const saveDraft = select("#saveDraft");
if (saveDraft) {
  makeTouchable(saveDraft).mousePressed(() => {
    const draft = {
      snapshots: snapshots.map(s => ({
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
        shape: s.shape,
        borderColor: s.borderColor,
        img: s.img.canvas.toDataURL()
      })),
      drawnLines: drawnLines
    };
    localStorage.setItem("pinpin_draft", JSON.stringify(draft));
    alert("草稿已保存！");
  });
}

// 载入草稿
const loadDraft = select("#loadDraft");
if (loadDraft) {
  makeTouchable(loadDraft).mousePressed(() => {
    const draftData = localStorage.getItem("pinpin_draft");
    if (draftData) {
      const draft = JSON.parse(draftData);
      // 恢复拼贴
      snapshots = draft.snapshots.map(s => {
        const img = loadImage(s.img);
        return {
          x: s.x,
          y: s.y,
          w: s.w,
          h: s.h,
          shape: s.shape,
          borderColor: s.borderColor,
          img: img
        };
      });
      // 恢复画笔
      drawnLines = draft.drawnLines || [];
      alert("草稿已载入！");
    } else {
      alert("没有可用草稿！");
    }
  });
}




}

function adjustCanvasSize() {
  if (window.innerWidth < 768) {
    // 手机模式
    if (window.innerWidth > window.innerHeight) {
      // 横屏 4:3
      canvasW = window.innerWidth;
      canvasH = window.innerWidth * 3 / 4;
    } else {
      // 竖屏 3:4
      canvasW = window.innerWidth;
      canvasH = window.innerWidth * 4 / 3;
    }
  } else {
    // 桌面/iPad 固定比例
    canvasW = 640;
    canvasH = 480;
  }
}

function setCameraStatus(message) {
  const status = document.getElementById("cameraStatus");
  if (status) status.textContent = message;
}

function cameraStarted() {
  camReady = true;
  const prompt = document.getElementById("cameraPrompt");
  if (prompt) prompt.classList.add("camera-ready");
  setCameraStatus("摄像头已开启");
}

function cameraFailed(message) {
  camReady = false;
  const startBtn = document.getElementById("startCameraBtn");
  if (startBtn) startBtn.removeAttribute("disabled");
  setCameraStatus(message);
}

function startCamera() {
  if (!window.isSecureContext) {
    cameraFailed("请使用 HTTPS 打开此网页");
    return;
  }

  if (cam) cam.remove();
  camReady = false;

  try {
    cam = createCapture({
      video: {
        facingMode: usingFrontCamera ? "user" : "environment",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });
    cam.size(640, 480);
    cam.hide();

    const video = cam.elt;
    let elapsed = 0;
    const checkInterval = setInterval(() => {
      elapsed += 100;
      if (video && (video.readyState >= 2 || video.videoWidth > 0)) {
        clearInterval(checkInterval);
        cameraStarted();
      } else if (elapsed >= 8000) {
        clearInterval(checkInterval);
        cameraFailed("没有拿到摄像头。请在 Safari 的网站设置中允许摄像头后再试。");
      }
    }, 100);

    if (video) {
      video.addEventListener("error", () => {
        clearInterval(checkInterval);
        cameraFailed("摄像头启动失败，请检查 Safari 的摄像头权限。");
      }, { once: true });
    }
  } catch (error) {
    cameraFailed("摄像头启动失败，请检查 Safari 的摄像头权限。");
  }
}

function draw() {
  if (useStaticBackground && exportBackgroundColor) {
    background(exportBackgroundColor);
  } else if (cam && camReady) {
    if (usingFrontCamera) {
      push();
      translate(width, 0);
      scale(-1, 1);
      image(cam, 0, 0, width, height);
      pop();
    } else {
      image(cam, 0, 0, width, height);
    }
  } else {
    background(255);
  }



  if (mode === "free") {
    for (let i = snapshots.length - 1; i >= 0; i--) {
  let snap = snapshots[i];
  
  if (selecting) {
    tint(255, 120); // 半透明
  } else {
    noTint(); // 正常显示
  }

  image(snap.img, snap.x, snap.y, snap.w, snap.h);

  noTint(); // 重置透明度，防止影响后续
  
  if (snap.borderColor && snap.borderColor !== "none") {
    noFill();
    stroke(snap.borderColor);
    strokeWeight(2);
    if (snap.shape === "ellipse") {
      ellipse(snap.x + snap.w / 2, snap.y + snap.h / 2, snap.w, snap.h);
    } else {
      rect(snap.x, snap.y, snap.w, snap.h);
    }
  }

}







   if (selecting) {
  let x = min(startX, mouseX);
  let y = min(startY, mouseY);
  let w = abs(mouseX - startX);
  let h = abs(mouseY - startY);

  noFill();
  stroke(255);
  strokeWeight(2);
  if (shapeType === "ellipse") {
    ellipse(x + w / 2, y + h / 2, w, h);
  } else {
    rect(x, y, w, h);
  }
}


  } else if (mode === "grid") {
    if (!useStaticBackground && camReady) {
      if (usingFrontCamera) {
        push();
        translate(width, 0);
        scale(-1, 1);
        image(cam, 0, 0, width, height);
        pop();
      } else {
        image(cam, 0, 0, width, height);
      }
    }
    

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        let idx = y * gridSize + x;
        let px = x * cellW;
        let py = y * cellH;

        if (gridSnaps[idx]) {
          image(gridSnaps[idx], px, py, cellW, cellH);
        }

        noFill();
        stroke(255);
        strokeWeight(1);
        rect(px, py, cellW, cellH);
      }
    }
  }
if (camReady) {
  camFrame = cam.get(); // 不做任何镜像处理
}



  // 🖍️ 已完成的线条
noFill();
stroke(255);
strokeWeight(4);
//for (let i = 0; i < drawnLines.length; i++) {
  //let line = drawnLines[i];
for (let line of drawnLines) {
  beginShape();
  for (let pt of line) {
    let jitterX = random(-1, 1); // 抖动
    let jitterY = random(-1, 1);
    vertex(pt.x + jitterX, pt.y + jitterY);
    //vertex(pt.x, pt.y); // 不再抖动
  }
  endShape();
}

// 🖍️ 当前正在画的线条（未松开）
if (drawingMode && currentLine.length > 0) {
  beginShape();
  for (let pt of currentLine) {
   let jitterX = random(-1, 1);
   let jitterY = random(-1, 1);
   vertex(pt.x + jitterX, pt.y + jitterY);
    //vertex(pt.x, pt.y); // 不再抖动
  }
  endShape();
}

}

function mouseDragged() {
  if (drawingMode) {
    currentLine.push({ x: mouseX, y: mouseY });
  }
}

function mouseReleased() {
  if (!camReady || mode !== "free") return;

  // 🖍️ 画笔模式下保存线条
  if (drawingMode && currentLine.length > 0) {
    drawnLines.push(currentLine);
    //drawnLines.unshift(currentLine); // 新线条放数组最前

    currentLine = [];
    return;
  }

  // 📸 截图模式下处理截图
  if (!drawingMode && selecting) {
    selecting = false;

    let x = min(startX, mouseX);
    let y = min(startY, mouseY);
    let w = abs(mouseX - startX);
    let h = abs(mouseY - startY);

    if (w > 1 && h > 1 && camReady) {
      let snap = captureSnapshot(x, y, w, h);

      // 遮罩（可选：椭圆/花瓣）
      if (shapeType === "ellipse") {
        let mask = createGraphics(w, h);
        mask.noStroke();
        mask.fill(255);
        mask.ellipse(w / 2, h / 2, w, h);
        snap.mask(mask);
      } else if (shapeType === "flower") {
        let mask = createGraphics(w, h);
        mask.noStroke();
        mask.fill(255);
        let petals = 6;
        let centerX = w / 2;
        let centerY = h / 2;
        let rX = w * 0.2;
        let rY = h * 0.2;
        let R = 0.2;
        mask.ellipse(centerX, centerY, rX * 1.8, rY * 1.8);
        for (let i = 0; i < petals; i++) {
          let angle = TWO_PI * i / petals;
          let px = centerX + cos(angle) * w * R;
          let py = centerY + sin(angle) * h * R;
          mask.ellipse(px, py, rX * 2, rY * 2);
        }
        snap.mask(mask);
      }

      snapshots.unshift({
        img: snap,
        x: x,
        y: y,
        w: w,
        h: h,
        shape: shapeType,
        borderColor: borderColor
      });
    }
  }
}


function touchMoved() {
  if (drawingMode) {
    currentLine.push({ x: mouseX, y: mouseY });
    return false;
  }
}

function touchEnded() {
  if (drawingMode && currentLine.length > 0) {
    drawnLines.push(currentLine);
    currentLine = [];
    return false;
  }
}

function captureSnapshot(x, y, w, h) {
  let snap;
  if (usingFrontCamera) {
    // 使用前置摄像头截图，需要镜像处理
    let mirrored = createGraphics(width, height);
    mirrored.translate(width, 0);
    mirrored.scale(-1, 1);
    mirrored.image(cam, 0, 0, width, height);
    snap = mirrored.get(x, y, w, h);
  } else {
    // 使用后置摄像头截图，直接获取
    let snapshotGraphic = createGraphics(width, height);
snapshotGraphic.image(cam, 0, 0, width, height);
snap = snapshotGraphic.get(x, y, w, h);

  }
  return snap;
}


let lastTapTime = 0;
const doubleTapThreshold = 300; // 两次点击间隔小于300ms算双击

function touchStarted() {
  let currentTime = millis();
  if (currentTime - lastTapTime < doubleTapThreshold) {
    handleDoubleTap(mouseX, mouseY); // 模拟双击
  }
  lastTapTime = currentTime;

  if (!camReady || mode !== "free") return false;

  if (drawingMode) {
    currentLine = [];
    currentLine.push({ x: mouseX, y: mouseY });
    return false;
  }

  // 开始截图
  startX = mouseX;
  startY = mouseY;
  selecting = true;
  return false;
}




function touchEnded() {
  
  if (!camReady || mode !== "free") return false;

    if (drawingMode && currentLine.length > 0) {
    drawnLines.push(currentLine);
    currentLine = [];
    return false;
  }

  selecting = false;

  let endX = mouseX;
  let endY = mouseY;

  let x = min(startX, endX);
  let y = min(startY, endY);
  let w = abs(endX - startX);
  let h = abs(endY - startY);

  if (w > 1 && h > 1 && camReady) {
    let snap = captureSnapshot(x, y, w, h);

    if (shapeType === "ellipse") {
      let mask = createGraphics(w, h);
      mask.noStroke();
      mask.fill(255);
      mask.ellipse(w / 2, h / 2, w, h);
      snap.mask(mask);
    } else if (shapeType === "flower") {
      let mask = createGraphics(w, h);
      mask.noStroke();
      mask.fill(255);
      let petals = 6;
      let centerX = w / 2;
      let centerY = h / 2;
      let rX = w * 0.2;
      let rY = h * 0.2;
      let R = 0.2;
      mask.ellipse(centerX, centerY, rX * 1.8, rY * 1.8);
      for (let i = 0; i < petals; i++) {
        let angle = TWO_PI * i / petals;
        let x = centerX + cos(angle) * w * R;
        let y = centerY + sin(angle) * h * R;
        mask.ellipse(x, y, rX * 2, rY * 2);
      }
      snap.mask(mask);
    }

    snapshots.unshift({
      img: snap,
      x: x,
      y: y,
      w: w,
      h: h,
      shape: shapeType,
      borderColor: borderColor
    });
  }

  return false;
}



function doubleClicked() {
  if (mode !== "free") return false;

  for (let i = 0; i < snapshots.length; i++) {
    let snap = snapshots[i];
    if (
      mouseX >= snap.x && mouseX <= snap.x + snap.w &&
      mouseY >= snap.y && mouseY <= snap.y + snap.h
    ) {
      // 如果已经是置顶（第一张）
      if (i === 0) {
        let confirmed = confirm("是否删除这张拼贴图块？");
        if (confirmed) {
          snapshots.splice(i, 1);
        }
      } else {
        // 否则就置顶
        snapshots.splice(i, 1);
        snapshots.unshift(snap);
      }

      return false;
    }
  }

  return false;
}

function handleDoubleTap(x, y) {
  for (let i = 0; i < snapshots.length; i++) {
    let snap = snapshots[i];
    if (
      x >= snap.x && x <= snap.x + snap.w &&
      y >= snap.y && y <= snap.y + snap.h
    ) {
      // 已经是置顶
      if (i === 0) {
        let confirmed = confirm("是否删除这张拼贴图块？");
        if (confirmed) {
          snapshots.splice(i, 1);
        }
      } else {
        // 否则置顶
        snapshots.splice(i, 1);
        snapshots.unshift(snap);
      }
      return false;
    }
  }
  return false;
}




let exportBackgroundColor = null;
let useStaticBackground = false;

function makeTouchable(btn) {
  // 支持触摸点击
  btn.elt.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (typeof btn.mousePressedCallback === "function") {
      btn.mousePressedCallback();
    }
  });

  // 支持鼠标点击
  btn.elt.addEventListener("click", (e) => {
    if (typeof btn.mousePressedCallback === "function") {
      btn.mousePressedCallback();
    }
  });

  btn.mousePressed = (callback) => {
    btn.mousePressedCallback = callback;
  };
  return btn;
}






function updateModeVisibility() {
  if (mode === "free") {
    select("#freeOptions").style("display", "block");
    select("#gridOptions").style("display", "none");
  } else {
    select("#freeOptions").style("display", "none");
    select("#gridOptions").style("display", "block");
  }
}

function updateHighlights() {
  const active = "active";

  // 模式按钮
  select("#modeFree").removeClass(active);
  select("#modeGrid").removeClass(active);
  if (mode === "free") select("#modeFree").addClass(active);
  if (mode === "grid") select("#modeGrid").addClass(active);
  select("#shapeFlower").removeClass(active);
if (shapeType === "flower") select("#shapeFlower").addClass(active);


  // 图形按钮
  select("#shapeRect").removeClass(active);
  select("#shapeEllipse").removeClass(active);
  if (shapeType === "rect") select("#shapeRect").addClass(active);
  if (shapeType === "ellipse") select("#shapeEllipse").addClass(active);

  // 颜色按钮
  const buttons = selectAll("button", select("#colorButtons"));
  buttons.forEach((btn) => {
    btn.removeClass(active);
    if (btn.attribute("data-color") === borderColor) {
      btn.addClass(active);
    }
  });

  // 网格尺寸按钮高亮（如果存在）
  const gridButtons = selectAll(".gridSizeBtn");
  gridButtons.forEach((btn) => {
    btn.removeClass(active);
    if (parseInt(btn.attribute("data-size")) === gridSize) {
      btn.addClass(active);
    }
  });
}



function setupButtons() {

  
  
  makeTouchable(select("#modeFree")).mousePressed(() => {
    mode = "free";
    updateHighlights();
    updateModeVisibility();
  });

  makeTouchable(select("#modeGrid")).mousePressed(() => {
    mode = "grid";
    updateHighlights();
    updateModeVisibility();
  });

  makeTouchable(select("#shapeRect")).mousePressed(() => {
    shapeType = "rect";
    updateHighlights();
  });

  makeTouchable(select("#shapeEllipse")).mousePressed(() => {
    shapeType = "ellipse";
    updateHighlights();
  });

  makeTouchable(select("#toggleDrawing")).mousePressed(() => {
  drawingMode = !drawingMode;

  if (drawingMode) {
    select("#toggleDrawing").html("✅ 画笔开启");
    select("#toggleDrawing").addClass("active");
  } else {
    select("#toggleDrawing").html("🖍️ 开启画笔");
    select("#toggleDrawing").removeClass("active");
  }
});


  
makeTouchable(select("#saveBtn")).mousePressed(() => {
  const a4Width = 1240;  // A4 @300dpi 宽度 (px)
  const a4Height = 1754; // A4 @300dpi 高度 (px)

  // 创建固定尺寸的 A4 画布
  let a4Canvas = createGraphics(a4Width, a4Height);
  a4Canvas.pixelDensity(1); // 避免高分屏导致尺寸过大
  a4Canvas.background(255); // 白色底

  // 1️⃣ 绘制你的 A4 背景 PNG
  /*if (a4BackgroundImg) {
    a4Canvas.image(a4BackgroundImg, 0, 0); // 不缩放，原尺寸贴上
  }*/

  // 2️⃣ 拼贴图适当放大并居中
 let scaleFactor = 1.3; // 默认放大比例

// 如果是竖屏（高 > 宽），适当提高放大比例
if (height > width) {
  scaleFactor = 2.2; // 手机竖屏时放大更多
}
// 适当放大
  const imgWidth = width * scaleFactor;
  const imgHeight = height * scaleFactor;
  const xOffset = (a4Width - imgWidth) / 2;
  const yOffset = (a4Height - imgHeight) / 2 - 160;

  // 将拼贴内容绘制到中间
  let pg = createGraphics(width, height);

  if (useStaticBackground && exportBackgroundColor) {
    pg.background(exportBackgroundColor);
  } else if (camFrame) {
  if (usingFrontCamera) {
    pg.push();
    pg.translate(width, 0);
    pg.scale(-1, 1);
    pg.image(camFrame, 0, 0, width, height);
    pg.pop();
  } else {
    pg.image(camFrame, 0, 0, width, height);
  }


  } else {
    pg.background(255);
  }

  // 绘制拼贴内容
  if (mode === "free") {
    for (let i = snapshots.length - 1; i >= 0; i--) {
      let snap = snapshots[i];
      pg.image(snap.img, snap.x, snap.y, snap.w, snap.h);
      if (snap.borderColor && snap.borderColor !== "none") {
        pg.noFill();
        pg.stroke(snap.borderColor);
        pg.strokeWeight(2);
        if (snap.shape === "ellipse") {
          pg.ellipse(snap.x + snap.w / 2, snap.y + snap.h / 2, snap.w, snap.h);
        } else {
          pg.rect(snap.x, snap.y, snap.w, snap.h);
        }
      }
    }
  }


  if (mode === "grid") {
  // 绘制 gridSnaps 到 pg
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let idx = y * gridSize + x;
      let snap = gridSnaps[idx];
      if (snap) {
        let px = x * cellW;
        let py = y * cellH;
        pg.image(snap, px, py, cellW, cellH);
      }
    }
  }
}



  // 绘制画笔线条
  pg.noFill();
  pg.stroke(255);
  pg.strokeWeight(4);
  for (let line of drawnLines) {
    pg.beginShape();
    for (let pt of line) {
      pg.vertex(pt.x, pt.y);
    }
    pg.endShape();
  }

  // 将拼贴内容绘制到 A4 画布
  a4Canvas.image(pg, xOffset, yOffset, imgWidth, imgHeight);

  // 保存 PNG
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");
  let hour = String(now.getHours()).padStart(2, "0");
  let minute = String(now.getMinutes()).padStart(2, "0");
  let filename = `pinpin_${year}-${month}-${day}_${hour}-${minute}.png`;
  a4Canvas.save(filename);
});




 
  // 📸 拼贴按钮
  const undoSnapBtn = select("#undoSnapBtn");
  const clearSnapBtn = select("#clearSnapBtn");

  makeTouchable(undoSnapBtn).mousePressed(() => {
    if (snapshots.length > 0) {
      snapshots.shift(); // 撤销上一张拼贴
    }
  });

  makeTouchable(clearSnapBtn).mousePressed(() => {
    snapshots = []; // 清空所有拼贴
    for (let i = 0; i < gridSnaps.length; i++) {
      gridSnaps[i] = null;
    }
  });

  // 🖌️ 画笔按钮
  //const undoDrawBtn = select("#undoDrawBtn");
  const clearDrawBtn = select("#clearDrawBtn");

// makeTouchable(undoDrawBtn).mousePressed(() => {
//   console.log("🖌️ 画笔撤销 clicked");
//   if (drawnLines.length > 0) {
//     console.log("🖌️ 撤销前 drawnLines:", drawnLines.length);
//     drawnLines.pop();
//     console.log("🖌️ 撤销后 drawnLines:", drawnLines.length);
//     redraw(); // 确保刷新
//   //if (drawnLines.length > 0) {
//     //drawnLines.pop(); // 删除最后一条线
//     //redraw();          // 立即刷新画布（可选）
//   }
// });


  makeTouchable(clearDrawBtn).mousePressed(() => {
    drawnLines = []; // 清空所有线条
  });



  makeTouchable(select("#flipBtn")).mousePressed(() => {
    usingFrontCamera = !usingFrontCamera;
    startCamera();
  });

  // 在 setupButtons() 中的图形按钮部分添加：
makeTouchable(select("#shapeFlower")).mousePressed(() => {
  shapeType = "flower";
  updateHighlights();
});

const colors = [
 /* { label: "红", value: "#D21D0D" },   // 烟灰红 / 暖灰调
  { label: "黄", value: "#EABF34" },   // 麦金黄 / 柔金色
  { label: "蓝", value: "#076CAC" },   // 雾霾蓝 / 藏青调
  { label: "紫", value: "#A18BBE" },   // 灰紫 / 藕紫色
  { label: "绿", value: "#137E38" },   // 沉静绿 / 薄荷+墨绿
  { label: "无", value: "none" }       // 无边框*/
];






  let colorDiv = select("#colorButtons");
  for (let c of colors) {
    let btn = makeTouchable(createButton(c.label));
    btn.parent(colorDiv);
    btn.attribute("data-color", c.value);
    btn.mousePressed(() => {
      borderColor = c.value;
      updateHighlights();
    });
  }

  const bgOptions = [
    { label: "相机背景", value: null },
    { label: "白", value: "#FFFFFF" } , // 纯白色
    { label: "红", value: "#D21D0D" },   // 烟灰红 / 暖灰调
  { label: "蓝", value: "#076CAC" },   // 雾霾蓝 / 藏青调
  { label: "紫", value: "#A18BBE" },   // 灰紫 / 藕紫色
  { label: "绿", value: "#137E38" },   // 沉静绿 / 薄荷+墨绿
  ];
  let sidebar = select("#sidebar");
  let bgContainer = createDiv("导出背景:").parent(sidebar).class("section");
  for (let bg of bgOptions) {
    let bgBtn = makeTouchable(createButton(bg.label));
    bgBtn.parent(bgContainer);
    bgBtn.mousePressed(() => {
      exportBackgroundColor = bg.value;
      useStaticBackground = bg.value !== null;
      bgContainer.elt.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      bgBtn.addClass("active");
    });
    if (bg.value === null) bgBtn.addClass("active");
  }

  let gridButtons = selectAll(".gridSizeBtn");
  gridButtons.forEach((btn) => {
    makeTouchable(btn).mousePressed(() => {
      gridSize = int(btn.attribute("data-size"));
      cellW = width / gridSize;
      cellH = height / gridSize;
      gridSnaps = new Array(gridSize * gridSize).fill(null);
      gridButtons.forEach(b => b.removeClass("active"));
      btn.addClass("active");
    });
  });


  let c = document.querySelector("canvas");

const handleGridTouch = (x, y) => {
  if (mode !== "grid" || !camReady) return;

  const bounds = c.getBoundingClientRect();
  const mx = x - bounds.left;
  const my = y - bounds.top;
  const gx = floor(mx / cellW);
  const gy = floor(my / cellH);
  const idx = gy * gridSize + gx;

  if (idx < 0 || idx >= gridSnaps.length) return;

  const px = gx * cellW;
  const py = gy * cellH;

  if (gridSnaps[idx]) {
    gridSnaps[idx] = null;
  } else {
    setTimeout(() => {
      let snap = captureSnapshot(px, py, cellW, cellH);

    
      gridSnaps[idx] = snap;
    }, 0);
    
  }
};
c.addEventListener("mousedown", e => handleGridTouch(e.clientX, e.clientY));
c.addEventListener("touchstart", e => {
  let touch = e.touches[0];
  handleGridTouch(touch.clientX, touch.clientY);
});



};

document.querySelector("#sidebar").addEventListener("touchmove", e => e.stopPropagation(), { passive: true });


function resizeCanvasForOrientation() {
  let shortEdge = Math.min(window.innerWidth, window.innerHeight);
  let aspectRatio = window.innerWidth > window.innerHeight ? 4 / 3 : 3 / 4;

  let w, h;
  if (window.innerWidth > window.innerHeight) {
    // 横屏：横图 4:3
    h = shortEdge*0.7 ;  // 占短边 70%
    w = h * (4 / 3);
  } else {
    // 竖屏：竖图 3:4
    w = shortEdge ;
    h = w * (4 / 3);
  }

  resizeCanvas(w, h);
}

function windowResized() {
  resizeCanvasForOrientation();
}

  
