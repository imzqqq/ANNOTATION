// 全景片分辨率
var img_resolution_w, img_resolution_h;

//改用鼠标事件，在img更新时触发
function  mouse_click() {
    e = window.event;
    // startX, startY 为鼠标点击时初始坐标
    // diffX, diffY 为鼠标初始坐标与 box 左上角坐标之差，用于拖动
    var startX, startY, diffX, diffY;
    // 是否拖动，初始为 false
    var dragging = false;
    // var draw_obj = $('#img-item');
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
            // 计算左上角定点坐标   框的左边界x
            diffX = startX - e.target.offsetLeft;
            //                   上边界的y位置
            diffY = startY - e.target.offsetTop;
            
            //console.log("e.target.offsetLeft: "+e.target.offsetLeft+"---e.target.offsetTop: "+e.target.offsetTop);
        }
        else if (e.target.className.indexOf("img-main") != -1) { // 如果鼠标在 样本区域 被按下
            // 在页面创建 box
            // parent_box
            var active_box_total = document.createElement("div");
            active_box_total.id = 'parent_box_' + boxId ; // boxId默认为1
            active_box_total.className = "parent_box";
            document.body.appendChild(active_box_total);

            //box
            var active_box = document.createElement("div");
            active_box.id = "active_box";
            active_box.setAttribute("box_id", 'box_' + boxId); // boxId默认为1
            active_box.className = "box";
            active_box.style.position = 'absolute';
            active_box.style.top = startY + 'px';
            active_box.style.left = startX + 'px';
            active_box_total.appendChild(active_box);
            //label
            var active_label = document.createElement("div");
            active_label.id = 'label_box_' + boxId;
            active_label.className = "label";
            active_label.style.position = 'absolute';
            active_label.style.top = startY - 25 + 'px';
            active_label.style.left = startX - 3 + 'px';
            active_box_total.appendChild(active_label);
            $(active_label).html('<div class="box_label">' + "<font size=2>" + $('#ann input:checked').val() + "</font>" + "</div>");

            boxId++;
        }
    };

    //右键移除该矩形框
    document.oncontextmenu = function(e) {
        // 如果鼠标在 box 上按下右键
        if (e.target.className.match(/box/)) {
            //移除parent_box
            var box_id = $(e.target).attr('box_id');
            parent_box = document.getElementById('parent_' + box_id)
            document.body.removeChild(parent_box);
            //document.body.removeChild(box_id.parentNode);

            delete boxListOfSample[$(e.target).attr('box_id')]; //默认为空
            //还原背景色
            deleteCurToothStatus(toothListOfSample[$(e.target).attr('box_id')])
            delete toothListOfSample[$(e.target).attr('box_id')]; //默认为空
            //更新txt
            updateCurTagStatus();

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
            box_id = mb.getAttribute('box_id')

            //label和box一起移动
            var label = document.getElementById('label_' + box_id)

            label.style.top = e.pageY - diffY - 25 + 'px';
            label.style.left = e.pageX - diffX- 3 + 'px';

            //当前的moving_box—radio为黄色,并checked
            toothPosition = toothListOfSample[box_id];
            var tooth_status = document.getElementsByName(toothPosition)[0]
            deleteCurToothStatus(toothPosition)
            tooth_status.style.background = 'yellow';
        }
    };

    // 鼠标抬起
    document.onmouseup = function(e) {
         // 禁止拖动
        dragging = false;
        if (document.getElementById("active_box") !== null) {
            var ab = document.getElementById("active_box");
            box_id = ab.getAttribute('box_id')
            ab.removeAttribute("id");

            //如果是一个点，禁止写入
            if($(ab).width()=== 0 || $(ab).height() === 0){
                document.body.removeChild(ab.parentNode);
                return ;
            }

            //提示不要重复标注同一个牙位
            toothPosition = $('input[name="tooth"]:checked').val();
            var tooth_status = document.getElementsByName(toothPosition)[0]
            if(tooth_status.style.background === 'green'){
                document.body.removeChild(ab.parentNode);
                layer.msg('同一牙位请勿重复标注');
                return ;
            }

            //更新背景色->绿色,建立box->tooth
            updateTooth(ab);
            //更新txt
            updateLoc(ab);
            //牙位radio跳转到下一个
            updateToothRadio()

        }
        else if (document.getElementById("moving_box") !== null) {
            var mb = document.getElementById("moving_box");
            if($(mb).width()=== 0 || $(ab).height() === 0) return ;
            updateLoc(mb);
            // 移动之后松开恢复绿色
            box_id = mb.getAttribute('box_id');
            toothPosition = toothListOfSample[box_id];
            var tooth_status = document.getElementsByName(toothPosition)[0]
            tooth_status.style.background = 'green';
        }
    };

    function updateLoc(obj) {
        username = document.getElementsByClassName("avatar");
        img = document.getElementById("img-item");
        console.log("div.width: "+img.clientWidth+"---div.height: "+img.clientHeight);
        /*****************计算缩放因子*****************/
        var ratio = 1;
        var ratio_base_on_w = img.clientWidth/img_resolution_w;
        var ratio_base_on_h = img.clientHeight/img_resolution_h;
        console.log("img_resolution_w: "+img_resolution_w);
        console.log("img_resolution_h: "+img_resolution_h);
        console.log("ratio_base_on_w: "+ratio_base_on_w);
        // case 1
        var real_size_1_w = img_resolution_w * ratio_base_on_w;
        var real_size_1_h = img_resolution_h * ratio_base_on_w;
        console.log("real_size_1_h: "+real_size_1_h);
        // case 2
        var real_size_2_w = img_resolution_w * ratio_base_on_h;
        var real_size_2_h = img_resolution_h * ratio_base_on_h;
        // console.log("real_size_2_w: "+real_size_2_w);
        if(real_size_1_h<=img.clientHeight){
            ratio = ratio_base_on_w;
            console.log("ratio1: "+ratio);
        }
        else if (real_size_2_w<=img.clientWidth){
            ratio = ratio_base_on_h;
            console.log("ratio2: "+ratio);
        }
        /*********************************************/
        console.log("ratio: "+ratio);
        //                               0
        x_left = (obj.offsetLeft - img.offsetLeft)/ratio;
        //                             66 不随分辨率变化而改变
        y_left = (obj.offsetTop - img.offsetTop)/ratio;
        // console.log(img.offsetLeft +", "+ img.offsetTop);
        x_right = x_left + $(obj).width()/ratio;
        y_right = y_left + $(obj).height()/ratio;
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
        // var toothPosition = $('input[name="tooth"]:checked').val();
        //从box->tooth列表中读
        var toothPosition = toothListOfSample[box_id];
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
}


// 在index的imagehosting_callback()中回调
function get_img_resolution(obj){
    img_resolution_w = obj.img_resolution_w;
    img_resolution_h = obj.img_resolution_h;
    // console.log("get_img_resolution: "+img_resolution_w+', '+img_resolution_h);
}

function initTotalTagStatus(){
    var textarea = $('#annotation_total_status').val(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}

// c初始化当前图片的status列表、牙位状态（背景色）
function initCurTagStatus() {
    tagStrTotal = '';
    var textarea_cur = $('#annotation_cur_status').val(tagStrTotal);
    textarea_cur.scrollTop(textarea_cur[0].scrollHeight - textarea_cur.height());
}

function initToothStatus() {
    var tooth_status = document.getElementsByClassName('radio-inline')
    var radio_length = tooth_status.length;
    tooth_status[0].children[0].checked = true;
    //状态重置为未标注的
    for(var i=0; i< radio_length; i++)
    {
        tooth_status[i].style.background = '#7F9CCB' ;
    }
}


//删除所有box
function deleteParentBox(){
    console.log('执行了')
    var all_box = document.getElementsByClassName('parent_box');
    if(all_box !== null){
        var box_length = all_box.length;
        while (box_length--)
        {
            document.body.removeChild(all_box[0]);
        }
    }
    else{
        return ;
    }
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

//更新牙位状态
function updateCurToothStatus(toothPosition) {
    tagStrTotal = '';
    for (key in toothListOfSample) {
        tagStrTotal += toothListOfSample[key] + '\n';
    }
    var tooth_status = document.getElementsByName(toothPosition)[0]
    tooth_status.style.background = 'green';
}


//删除背景色并checked删除的box对应牙位
function deleteCurToothStatus(toothPosition){
    var tooth_status = document.getElementsByName(toothPosition)[0];
    tooth_status.style.background = '#7F9CCB';
    var tooth_status_all = document.getElementsByName('tooth')
    var radio_length = tooth_status_all.length;
    //状态重置为未标注的
    for(var i=0; i< radio_length; i++)
    {
        tooth_status_all[i].checked = false;
    }
    tooth_status.children[0].checked = true;
}



// 全部CurTagStatus列表
function updateTotalTagStatus() {
    tagStrTotal = '';
    for (key in boxListOfSample) {
        tagStrTotal += boxListOfSample[key] + '\n';
    }
    var textarea = $('#annotation_total_status').append(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
    console.log('已更新')
}

//更新类别
function updateRegionClass(regionClass,toothPosition){
    for(key in toothListOfSample){
        if(toothListOfSample[key] === toothPosition){
            target_key = key;
            break;
        }
    }
    tagStr = boxListOfSample[target_key];
    var arr1=tagStr.split(",")
    arr1[7] = regionClass
    tagStr = arr1[0] + "," + arr1[1] + "," + arr1[2] + "," + arr1[3] + "," + arr1[4] + "," + arr1[5] + "," + arr1[6] +", " + arr1[7] + "," + arr1[8] +"," + arr1[9];
    boxListOfSample[target_key] = tagStr;
    updateRegionClassLabel(target_key,regionClass);
    updateCurTagStatus();
    layer.msg('牙评分已更新完毕');
}


//更新box的label
function updateRegionClassLabel(key,regionClass){
    var target_label = document.getElementById('label_' + key);
    $(target_label).html('')
    $(target_label).html('<div class="box_label">' + "<font size=2>" + regionClass + "</font>" + "</div>");
}

/*************************************************************/
//牙位更新radio
function updateToothRadio(){
    var all_radio = document.getElementsByName("tooth");
    var radio_length = all_radio.length;
    for (var i = 0; i < radio_length; i++) {
        if (all_radio[i].checked) {
            all_radio[i].checked = false;
            if(i === radio_length - 1)
                all_radio[0].checked = true;
            else
                all_radio[i + 1].checked = true;
            break;
        }
    }
}

function checkAnnFinish(){
    var tooth_status = document.getElementsByClassName('radio-inline');
    //前32个
    for(var i=0; i<32; i++)
    {
        // 有没标注完的
        if(tooth_status[i].style.background !== 'green')
            return false;
    }
    return true;
}