/**
 * 业务相关的JS处理代码
 */
sampleCount = 0;
sampleCurrentIndex = 0;
boxId = 1;
boxListOfSample = {}; //一张样本图片的所有标注集合(box_id为key)
toothListOfSample = {};
pre_picture = "";
//Returns the first element that is a descendant of node that matches selectors.
// const input = document.querySelector('input');
const preview = document.querySelector('.preview');
//将事件监听器添加到input中，以监听选择的值的更改（当选择文件时）
// input.addEventListener('change', updateImageDisplay);
const fileTypes = [
    'image/bmp',
    'image/jpeg',
    'image/pjpeg',
    'image/png'
];

function updateImageDisplay(obj){
     while (preview.firstChild) {
        preview.removeChild(preview.firstChild);
     }
     var i = 0;
     const list = document.createElement('ol');
     preview.appendChild(list);
     const listItem = document.createElement('li');
     const para_name = document.createElement('p');
     const image = document.createElement('img');
     //通过调用URL.createObjectURL(curFiles[i])来生成图片的一张缩略预览图
     image.src = obj.img_url
     image.alt = obj.img_name
     
     para_name.textContent = '文件名:  ' + image.alt + '---------文件大小:  ' + obj.img_size + '---------分辨率:  ' + '(' + obj.img_resolution_w + ', ' + obj.img_resolution_h + ')';
     listItem.appendChild(image);
     listItem.appendChild(para_name);
     list.appendChild(listItem);
     initPage(obj);
     initCurTagStatus();
     initToothStatus();

     //拿到第一个图片
     if( pre_picture === ""){
         pre_picture = $('#cur_id').html();
     }

     //图片变化了就保存
     updateTotalTagStatus();
     saveAnnotationTXT('no_save');

     deleteParentBox();
     mouse_click();          //启用鼠标事件
}

function initPage(obj){
    loadSamplePic(obj);


    $('#btn_save').click(function() {
        // if(!checkCurToothStatus()){
        //     layer.msg('标注未完成！！！');
        //     return;
        // }
        if (JSON.stringify(boxListOfSample) == '{}') {
            //layer.msg('请先进行标注!!!');
            return;
        }
        updateTotalTagStatus();
        initCurTagStatus(); //更新文本框不更新牙位
        saveAnnotationTXT('save');
    });

    //将标签类型加载到下拉菜单中
    get_labels();
    $('#annotation-type').click(function() {
        var regionClass = $('#ann input:checked').val();
        var toothPosition = $('input[name="tooth"]:checked').val();
        var tooth_label = document.getElementsByName(toothPosition)[0]
        if(tooth_label.style.background === 'green'){
            updateRegionClass(regionClass,toothPosition);
        }
        $(document).focus();
    });
}

function loadSamplePic(obj){
    //加载图片
    picNameStr = obj.img_name;
    img_url = obj.img_url;
    $('#img-item').css({ "background": "url('" + img_url + "')   left top/contain no-repeat" });
    //当前文件
    $('#cur_id').html(picNameStr);
    $('.box').remove();
    //当前坐标区域
    $('#cur_loc').html('');
    var year, month, day;
    //针对文件中有拍片日期的情况
    if (picNameStr.indexOf("-") !== -1) {
        var thedate = picNameStr.split("-");
        var pre_shootdate = thedate[1].slice(0, 8);
        year = pre_shootdate.slice(0, 4);
        month = pre_shootdate.slice(4, 6);
        day = pre_shootdate.slice(6, 8);
        var shootdate = (year) + "-" + (month) + "-" + (day);
        $('#shootingDate').val(shootdate);
        $('#datetips').val('已从文件名中读取拍片日期');
    } else {
        var time = new Date();
        day = ("0" + time.getDate()).slice(-2);
        month = ("0" + (time.getMonth() + 1)).slice(-2);
        var today = time.getFullYear() + "-" + (month) + "-" + (day);
        $('#shootingDate').val(today);
        $('#datetips').val('请手动设置拍片日期');
    }
}


function get_labels() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/api/annotation/labels?" + new Date(),
        beforeSend: function() {},
        success: function(result) {
            if (result.message == '保存成功！') {
                var html = '<span><b>标注类型</b></span><br/><br/><span></span><div class="form-group" id="ann" name="annotation">';
                index = 0;
                for (var i in result.data) {
                    var id = 'region_' + result.data[i].name;
                    var value = result.data[i].name;
                    var text = result.data[i].desc;
                    // 修改标注类型,默认选中第一个
                    if (index == 0) {
                        html += '<label class="radio-inline"><input type="radio" checked name="annotation-item" id="' + id + '" value="' + value + '">';
                    } else {
                        html += '<label class="radio-inline"><input type="radio" name="annotation-item" id="' + id + '" value="' + value + '">';
                    }
                    html += ' ' + text + '</label>';
                    index++;
                }
                html += '</div>';
                $('#annotation-type').html(html);
            }
        },
        error: function() {}
    });
}

function saveAnnotationTXT(flag){
    //监听图片框的变化，没标注就不保存
    if (JSON.stringify(boxListOfSample) == '{}') {
            return;
    }
    if(flag === 'save'){
        //标注当前图片 ——> 用于写入外键
        picNameStr = $('#cur_id').html();
        pre_picture = $('#cur_id').html();
    }
    else{
        picNameStr = pre_picture
    }
    user = document.getElementsByClassName("avatar");
    user_name =  user[0].alt;

    tagStrTotal =  $('#annotation_total_status').val();
    for (key in boxListOfSample) {
        tagStrTotal += boxListOfSample[key] + '\n';
    }
    ann_flag = checkAnnFinish();
    console.log(picNameStr);
    console.log(ann_flag);
    saveRegionInfo(tagStrTotal,user_name,picNameStr,ann_flag);
    $('#cur_loc').html('');

    boxId = 1;
    boxListOfSample = {};
}


//接受一个File对象作为参数，然后使用Array.prototype.includes()检查fileTypes中是否有值和文件的type属性匹配
function validFileType(file) {
    return fileTypes.includes(file.type);
}

//接受一个数字（字节数，取自当前文件的size属性）作为参数，并且将其转化为用bytes/KB/MB表示的格式良好的大小
function returnFileSize(number) {
    if (number < 1024) {
        return number + 'bytes';
    } else if (number >= 1024 && number < 1048576) {
        return (number / 1024).toFixed(1) + 'KB';
    } else if (number >= 1048576) {
        return (number / 1048576).toFixed(1) + 'MB';
    }
}

function saveRegionInfo(tagResult, username, picNameStr,ann_flag) {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/api/annotation/save?" + new Date(),
        data: { 'tags': tagResult, 'user': username, 'pic_name' : picNameStr, 'flag' : ann_flag},
        beforeSend: function() {},
        success: function(result) {
            layer.msg(result.message);
        },
        error: function() {}
    });
}

function isPassword(str) {
    var reg = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,15}/;
    return reg.test(str);
}

//时间戳转换成八位日期
function format2Date(uData) {
    var myDate = new Date(uData);
    var year = myDate.getFullYear();
    var month = myDate.getMonth() + 1;
    var day = myDate.getDate();
    return year + '-' + month + '-' + day;
}

//时间戳转换成时间字符串
function format2Time(uData) {
    var myDate = new Date(uData);
    var year = myDate.getFullYear();
    var month = myDate.getMonth() + 1;
    var day = myDate.getDate();
    var hour = myDate.getHours();
    var minute = myDate.getMinutes();
    var second = myDate.getSeconds();
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}