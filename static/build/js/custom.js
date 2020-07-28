/**
 * 业务相关的JS处理代码
*/
sampleCount = 0;
sampleCurrentIndex = 0;
boxId = 1;
boxListOfSample = {}; //一张样本图片的所有标注集合(box_id为key)

const input = document.querySelector('input');
const preview = document.querySelector('.preview');
//将事件监听器添加到input中，以监听选择的值的更改（当选择文件时）
input.addEventListener('change', updateImageDisplay);
const fileTypes = [
    'image/bmp',
    'image/jpeg',
    'image/pjpeg',
    'image/png'];

function updateImageDisplay() {
    //使用一个while循环来清空preview<div>留下的内容
    while(preview.firstChild) {
      preview.removeChild(preview.firstChild);
    }
    //获取包含所有已选择文件信息的 FileList 对象
    const curFiles = input.files;
    //通过检查 curFiles.length 是否等于0来检查是否没有文件被选择
    if(curFiles.length === 0) {
      const para = document.createElement('p');
      para.textContent = 'No files currently selected for upload';
      preview.appendChild(para);
    } else {
        var i = 0;
        const list = document.createElement('ol');
        preview.appendChild(list);
        //如果选择了文件，我们将循环遍历每个文件
        for(const file of curFiles) {
            const listItem = document.createElement('li');
            const para = document.createElement('p');
            //使用定制的validFileType()函数来检查文件的类型是否正确（用accept属性指定的图片类型）
            if(validFileType(file)) {
                //定制的returnFileSize()函数返回一个用bytes/KB/MB表示的格式良好的大小
                para.textContent = `File name: ${file.name}, File size: ${returnFileSize(file.size)}.`;
                const image = document.createElement('img');
                //通过调用URL.createObjectURL(curFiles[i])来生成图片的一张缩略预览图
                image.src = URL.createObjectURL(file);
                listItem.appendChild(image);
                listItem.appendChild(para);
                
            } else {
                para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
                listItem.appendChild(para);
            }
            list.appendChild(listItem);
        }
        initPage();
    }
}

function initPage(){
        sampleCount = input.files.length;
        console.log("sampleCount---%d", sampleCount);
        $('#total').text(input.files.length);
        loadSamplePic(sampleCurrentIndex);

        $('#side_left').click(function(){
            initCurTagStatus();
            $('#btn_save').click();
            console.log("sampleCurrentIndex---side_left--before---%d", sampleCurrentIndex);
            sampleCurrentIndex -= 1;
            if(sampleCurrentIndex<0){
                sampleCurrentIndex = sampleCount-1;
            }
            console.log("sampleCurrentIndex---side_left--after---%d", sampleCurrentIndex);
            loadSamplePic(sampleCurrentIndex);
        });
        $('#side_right').click(function(){
            initCurTagStatus();
            $('#btn_save').click();
            console.log("sampleCurrentIndex---side_right--before---%d", sampleCurrentIndex);
            sampleCurrentIndex += 1;
            if(sampleCurrentIndex>sampleCount-1){
                sampleCurrentIndex = 0;
            }
            console.log("sampleCurrentIndex---side_right--after---%d", sampleCurrentIndex);
            loadSamplePic(sampleCurrentIndex);
        });
        $(document).keyup(function(event){
        if (event.keyCode === 37){//left
            initCurTagStatus();
            $('#side_left').click();
        }else if(event.keyCode === 39){//right
            initCurTagStatus();
            $('#side_right').click();
        }
        });
        $('#jump_page').keypress(function(e){
            if(e.keyCode==13){
                initCurTagStatus();
                var indexStr = $(this).val();
                index = parseInt(indexStr);
                if(index<=0 || indexStr==''){
                    index = sampleCurrentIndex;
                }else if(index>sampleCount-1){
                    index = sampleCount-1;
                }
                sampleCurrentIndex = index;
                loadSamplePic(index);
            }
        });
        $('#btn_save').click(function(){
            if (JSON.stringify(boxListOfSample) == '{}'){
                layer.msg('请先进行标注!!!');
                return;
            }
            tagStrTotal = '';
            for(key in boxListOfSample){
                tagStrTotal+=boxListOfSample[key]+'\n';
            }
            saveRegionInfo(tagStrTotal);
            $('#cur_loc').html('');
            updateTotalTagStatus();
            boxId = 1;
            boxListOfSample = {};
        });
        get_labels(); //将标签类型加载到下拉菜单中
        $('#annotation-type').click(function(){
            $(document).focus();
        });
}

function get_labels(){
    $.ajax({
		type : "GET",
		dataType : "json",
		url : "/api/annotation/labels?"+new Date(),
		beforeSend:function(){
		},
		success : function(result){
		    if(result.message=='保存成功！'){
		        var html = '<b>标注类型</b>&nbsp;&nbsp;&nbsp;<table class="radio-table" border id="ann" name="annotation" style="width:850px" ><tbody>';
		        index = 0;
		        for (var i in result.data){
		            var id = 'region_'+result.data[i].name;
		            var value = result.data[i].name;
                    var text = result.data[i].desc;
                    // 修改标注类型,默认选中第一个
		            if(index==0){
		                html += '<tr><td><input type="radio" checked name="annotation-item" id="'+id+'" value="'+value+'" onclick="clickRadio()"></td><td>';
                    }
                    else{
		                html += '<tr><td><input type="radio" name="annotation-item" id="'+id+'" value="'+value+'" onclick="clickRadio()"></td><td>';
		            }
		            html += ' '+text+'</td></tr>';
		            index++;
                }
                html += '</tbody></table>';
                $('#annotation-type').html(html);
		    }
		},
		error: function(){
		}
	});
}

//加载病例图片
function loadSamplePic(index){
    //加载图片
    const Files = input.files;
    var curFile = Files[index];
    picNameStr = curFile.name;
    url = "/api/annotation/sample?index="+picNameStr+'&time='+new Date();
    $('#img-item').css({"background":"url('"+url+"') no-repeat left top"});
    $('#cur_id').html(picNameStr); //当前文件
    $('.box').remove();
    $('#cur_loc').html(''); //当前坐标区域
}

//接受一个File对象作为参数，然后使用Array.prototype.includes()检查fileTypes中是否有值和文件的type属性匹配
function validFileType(file) {
    return fileTypes.includes(file.type);
}

//接受一个数字（字节数，取自当前文件的size属性）作为参数，并且将其转化为用bytes/KB/MB表示的格式良好的大小
function returnFileSize(number) {
    if(number < 1024) {
      return number + 'bytes';
    } else if(number >= 1024 && number < 1048576) {
      return (number/1024).toFixed(1) + 'KB';
    } else if(number >= 1048576) {
      return (number/1048576).toFixed(1) + 'MB';
    }
}

function saveRegionInfo(tagResult){
    $.ajax({
		type : "POST",
		dataType : "json",
		url : "/api/annotation/save?"+new Date(),
		data : {'tags':tagResult},
		beforeSend:function(){
		},
		success : function(result){
		    layer.msg(result.message);
		},
		error: function(){
		}
	});
}

function isPassword(str) {
	var reg = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,15}/;
	return reg.test(str);
}

//时间戳转换成八位日期
function format2Date(uData){
	var myDate = new Date(uData);
	var year = myDate.getFullYear();
	var month = myDate.getMonth() + 1;
	var day = myDate.getDate();
	return year + '-' + month + '-' + day;
}

//时间戳转换成时间字符串
function format2Time(uData){
	var myDate = new Date(uData);
	var year = myDate.getFullYear();
	var month = myDate.getMonth() + 1;
	var day = myDate.getDate();
	var hour = myDate.getHours();
	var minute = myDate.getMinutes();
	var second = myDate.getSeconds();
	return year + '-' + month + '-' + day+' '+hour+':'+minute+':'+second;
}

function clickRadio () {
    console.log(document.querySelector('.radio-table tbody input[type=radio]:checked'))
    // document.getElementById('checked').innerHTML = document.querySelector('.radio-table tbody input[type=radio]:checked').value
}