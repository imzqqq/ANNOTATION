$(function(e) {
    e = e || window.event;
    // startX, startY 为鼠标点击时初始坐标
    // diffX, diffY 为鼠标初始坐标与 box 左上角坐标之差，用于拖动
    var startX, startY, diffX, diffY;
    // 是否拖动，初始为 false
    var dragging = false;
    var draw_obj = $('#img-item');
    // 鼠标按下
    document.onmousedown = function(e) {
        startX = e.pageX;
        startY = e.pageY;
        // 如果鼠标在 box 上被按下
        if (e.target.className.match(/box/)) {
            // 允许拖动
            dragging = true;
            // 设置当前 box 的 id 为 moving_box
            if (document.getElementById("moving_box") !== null) {
                document.getElementById("moving_box").removeAttribute("id");
            }
            e.target.id = "moving_box";
            // 计算坐标差值
            diffX = startX - e.target.offsetLeft;
            diffY = startY - e.target.offsetTop;
        } else if (e.target.className.indexOf("img-main") != -1) { // 如果鼠标在 样本区域 被按下
            // 在页面创建 box
            var active_box = document.createElement("div");
            active_box.id = "active_box";
            active_box.setAttribute("box_id", 'box_' + boxId); // boxId默认为1
            boxId++;
            active_box.className = "box";
            active_box.style.position = 'absolute';
            active_box.style.top = startY + 'px';
            active_box.style.left = startX + 'px';
            document.body.appendChild(active_box);
            //*****************/
            // active_box = null;
            //*****************/
        }
    };

    //右键移除该矩形框
    document.oncontextmenu = function(e) {
        // 如果鼠标在 box 上按下右键
        if (e.target.className.match(/box/)) {
            document.body.removeChild(e.target);
            delete boxListOfSample[$(e.target).attr('box_id')]; //默认为空
            // delete toothListOfSample[$(e.target).attr('box_id')]; //默认为空
            updateCurTagStatus();
            console.log($(e.target).attr('box_id'));
            console.log(toothListOfSample[$(e.target).attr('box_id')]);
            deleteCurToothStatus(toothListOfSample[$(e.target).attr('box_id')])
            delete toothListOfSample[$(e.target).attr('box_id')]; //默认为空
            var lab = 'label_' + $(e.target).attr('box_id');
            cur_lab = document.getElementById(lab);
            //初始化标注的文字框
            $(cur_lab).html('');
            $('#cur_loc').html('');
            //不继续传递右键事件，即不弹出菜单
            return false;
        }
        return true;
    };

    // 鼠标移动
    document.onmousemove = function(e) {
        // 更新 box 尺寸
        if (document.getElementById("active_box") !== null) {
            var ab = document.getElementById("active_box");
            ab.style.width = e.pageX - startX + 'px';
            ab.style.height = e.pageY - startY + 'px';
        }
        // 移动，更新 box 坐标
        if (document.getElementById("moving_box") !== null && dragging) {
            var mb = document.getElementById("moving_box");
            mb.style.top = e.pageY - diffY + 'px';
            mb.style.left = e.pageX - diffX + 'px';
        }
    };

    // 鼠标抬起
    document.onmouseup = function(e) {
        // 禁止拖动
        dragging = false;
        if (document.getElementById("active_box") !== null) {
            var ab = document.getElementById("active_box");
            ab.removeAttribute("id");
            updateLoc(ab);
            updateTooth(ab);
            /**************************************************************/
            //牙位更新radio
            var curToothPosition = $('input[name="tooth"]:checked').val();
            var all_radio = document.getElementsByName("tooth");
            var radio_length = all_radio.length;
            for (var i = 0; i < radio_length; i++) {
                if (all_radio[i].checked) {
                    all_radio[i].checked = false;
                    if ((i + 1) == radio_length) {
                        all_radio[0].checked = true;
                        alert("标注完成！");
                        break;
                    } else {
                        all_radio[i + 1].checked = true;
                        break;
                    }
                }
            }
            /**************************************************************/
            //标签类别
            // 在页面创建 box
            var active_label = document.createElement("div");
            curboxid = boxId - 1;
            active_label.id = 'label_box_' + curboxid;
            active_label.className = "label";
            active_label.style.position = 'absolute';
            active_label.style.top = startY - 18 + 'px';
            active_label.style.left = startX - 3 + 'px';
            document.body.appendChild(active_label);
            $(active_label).html('<div class="box_label">' + "<font size=2>" + $('#ann input:checked').val() + "</font>" + "</div>");
        }
        else if (document.getElementById("moving_box") !== null) {
            var ab = document.getElementById("moving_box");
            updateLoc(ab);
        }
    };

    function updateLoc(obj) {
        username = document.getElementsByClassName("avatar");
        img = document.getElementById("img-item");
        x_left = obj.offsetLeft - img.offsetLeft;
        y_left = obj.offsetTop - img.offsetTop;
        x_right = x_left + $(obj).width();
        y_right = y_left + $(obj).height();
        var regionLoc = x_left + ',' + y_left; //2个坐标
        $('#cur_loc').html(regionLoc);
        var regionLocBRC = x_right + ',' + y_right;
        //照片id
        var picId = $('#cur_id').html();
        //拍片的日期
        var shootDate = document.querySelector('input[type="date"]').value;
        //标签类别
        var regionClass = $('#ann input:checked').val();
        //牙位
        var toothPosition = $('input[name="tooth"]:checked').val();
        //标注日期
        var time = new Date();
        day = ("0" + time.getDate()).slice(-2);
        month = ("0" + (time.getMonth() + 1)).slice(-2);
        var today = time.getFullYear() + "-" + (month) + "-" + (day);
        tagStr = picId + "," + shootDate + "," + regionLoc + "," + regionLocBRC + ", " + toothPosition + ", " + regionClass + ", " + username[0].alt +", " + today;
        box_id = $(obj).attr('box_id');
        boxListOfSample[box_id] = tagStr;
        updateCurTagStatus();
    }

    function updateTooth(obj){
         var toothPosition = $('input[name="tooth"]:checked').val();
         box_id = $(obj).attr('box_id');
         toothListOfSample[box_id] = toothPosition;
         updateCurToothStatus(toothPosition);
    }
});

// c初始化当前图片的status列表
function initCurTagStatus() {
    tagStrTotal = '';
    var textarea = $('#annotation_cur_status').val(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}

// 当前图片的status列表
function updateCurTagStatus() {
    tagStrTotal = '';
    for (key in boxListOfSample) {
        tagStrTotal += boxListOfSample[key] + '\n';
    }
    var textarea = $('#annotation_cur_status').val(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}

function updateCurToothStatus(toothPosition) {
    tagStrTotal = '';
    for (key in toothListOfSample) {
        tagStrTotal += toothListOfSample[key] + '\n';
    }
    var radio_button = document.getElementsByClassName(toothPosition)[0];
    radio_button.style.backgroundColor = 'green';
}

function deleteCurToothStatus(toothPosition) {
    var radio_button = document.getElementsByClassName(toothPosition)[0];
    radio_button.style.backgroundColor = 'red';
}



// 全部CurTagStatus列表
function updateTotalTagStatus() {
    tagStrTotal = '';
    for (key in boxListOfSample) {
        tagStrTotal += boxListOfSample[key] + '\n';
    }
    var textarea = $('#annotation_total_status').append(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}

function initCurToothStatus(){
     var all_radio = document.getElementsByName("tooth_status");
     var radio_length = all_radio.length;
     for (var i = 0; i < radio_length; i++) {
         all_radio[i].style.backgroundColor = 'maroon';
     }
}


function checkCurToothStatus(){
     var all_radio = document.getElementsByName("tooth_status");
     var radio_length = all_radio.length;
     for (var i = 0; i < radio_length; i++) {
         if(all_radio[i].style.backgroundColor !== 'green'){
             return false;
         }
     }
     return true;

}