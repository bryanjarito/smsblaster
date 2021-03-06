var stepped = 0, chunks = 0, rows = 0;
var start, end;
var parser;
var pauseChecked = false;
var printStepChecked = false;

$(function()
{
	$('#submit-parse').click(function()
	{
		stepped = 0;
		chunks = 0;
		rows = 0;

		var txt = $('#input').val();
		var localChunkSize = $('#localChunkSize').val();
		var remoteChunkSize = $('#remoteChunkSize').val();
		var files = $('#files')[0].files;
		if (files.length == 0) {
			alert('Please select a file!')
		} else if ($('.radiomsg:checked').val() == 'create' && $('#msg').val() == '') {
			alert('Please create a message first.')
		} else {
			$('.table tbody').html('')
			var config = buildConfig();

			// NOTE: Chunk size does not get reset if changed and then set back to empty/default value
			if (localChunkSize)
				Papa.LocalChunkSize = localChunkSize;
			if (remoteChunkSize)
				Papa.RemoteChunkSize = remoteChunkSize;

			pauseChecked = $('#step-pause').prop('checked');
			printStepChecked = $('#print-steps').prop('checked');


			if (files.length > 0)
			{
				// if (!$('#stream').prop('checked') && !$('#chunk').prop('checked'))
				// {
				// 	for (var i = 0; i < files.length; i++)
				// 	{
				// 		if (files[i].size > 1024 * 1024 * 10)
				// 		{
				// 			alert("A file you've selected is larger than 10 MB; please choose to stream or chunk the input to prevent the browser from crashing.");
				// 			return;
				// 		}
				// 	}
				// }

				start = performance.now();

				$('#files').parse({
					config: config,
					before: function(file, inputElem)
					{
						// console.log("Parsing file:", file);
					},
					complete: function()
					{
						// console.log("Done with all files.");
					}
				});

			}
			else
			{
				start = performance.now();
				var results = Papa.parse(txt, config);
				// console.log("Synchronous parse results:", results);
			}

		}
	});

	$('#insert-tab').click(function()
	{
		$('#delimiter').val('\t');
	});
});



function buildConfig()
{
	return {
		delimiter: $('#delimiter').val(),
		newline: getLineEnding(),
		header: $('#header').prop('checked'),
		dynamicTyping: $('#dynamicTyping').prop('checked'),
		preview: parseInt($('#preview').val() || 0),
		step: $('#stream').prop('checked') ? stepFn : undefined,
		encoding: $('#encoding').val(),
		worker: $('#worker').prop('checked'),
		comments: $('#comments').val(),
		complete: completeFn,
		error: errorFn,
		download: $('#download').prop('checked'),
		fastMode: $('#fastmode').prop('checked'),
		skipEmptyLines: $('#skipEmptyLines').prop('checked'),
		chunk: $('#chunk').prop('checked') ? chunkFn : undefined,
		beforeFirstChunk: undefined,
	};

	function getLineEnding()
	{
		if ($('#newline-n').is(':checked'))
			return "\n";
		else if ($('#newline-r').is(':checked'))
			return "\r";
		else if ($('#newline-rn').is(':checked'))
			return "\r\n";
		else
			return "";
	}
}

function stepFn(results, parserHandle)
{
	stepped++;
	rows += results.data.length;

	parser = parserHandle;

	if (pauseChecked)
	{
		// console.log(results, results.data[0]);
		parserHandle.pause();
		return;
	}

	// if (printStepChecked)
		// console.log(results, results.data[0]);
}

function chunkFn(results, streamer, file)
{
	if (!results)
		return;
	chunks++;
	rows += results.data.length;

	parser = streamer;

	// if (printStepChecked)
		// console.log("Chunk data:", results.data.length, results);

	if (pauseChecked)
	{
		// console.log("Pausing; " + results.data.length + " rows in chunk; file:", file);
		streamer.pause();
		return;
	}
}

function errorFn(error, file)
{
	console.log("ERROR:", error, file);
}

function completeFn()
{
	end = performance.now();
	if (!$('#stream').prop('checked')
			&& !$('#chunk').prop('checked')
			&& arguments[0]
			&& arguments[0].data)
		rows = arguments[0].data.length;

	// console.log("Finished input (async). Time:", end-start, arguments);
	// console.log("Rows:", rows, "Stepped:", stepped, "Chunks:", chunks);

	$('.table').attr('style','display: inline-table')
	var index = 1
	var row = ''
	var msg = ''

	if ($('.radiomsg:checked').val() == 'create') {
		msg = $('#msg').val()
	}

	arguments[0].data.forEach(element => {
		if ($('.radiomsg:checked').val() == 'csv') {
			msg = element[2]
		}
		if (element[0] != '' && element[1] != '') {
			var form = new FormData();
			form.append("app_id", "Ld8btyAyoGhRdiEdydcyMXhR9dngtAbo");
			form.append("app_secret", "92cacb25bd02f1cccf81d42a9e2509d1bc61ed846bd7774eac5dcf63aa12dc9f");
			form.append("message", msg);
			form.append("address", element[1]);
			form.append("passphrase", "IYdW2eSthT");

			var settings = {
			"async": true,
			"crossDomain": true,
			"url": "https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/5873/requests/",
			"method": "POST",
			"headers": {
				"cache-control": "no-cache",
			},
			"processData": false,
			"contentType": false,
			"mimeType": "multipart/form-data",
			"data": form
			}

			$.ajax(settings).done(function (response) {
				var currentdate = new Date(); 
				var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
			
				row = '<tr><td>' + index +'</td><td>' + element[0] +'</td><td>' + element[1] +'</td><td><span class="text-info">' +
				'Successfully sent</span></td><td>' + datetime + '</td></tr>'

				$('.table tbody').append(row)
				index++
			}).fail(function (xhr, status) {
				var currentdate = new Date(); 
				var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
				+ currentdate.getSeconds();

				if(xhr.responseText == null) {
					var err = "Error: Internet Disconnected"	
				} else {
					var err = JSON.parse(xhr.responseText).error
				}
				row = '<tr class=""><td>' + index +'</td><td>' + element[0] +'</td><td>' + element[1] +
				'</td><td><span class="text-danger font-weight-bold">' + err + '</span></td><td><button class="btn btn-outline-primary resend" data-number="' +
				element[1] + '" data-msg="' + msg + '"><i class="far fa-paper-plane"></i> Resend</button></td></tr>'
				
				$('.table tbody').append(row)
				index++
			});
		}
	});
}

$(document).ready(function(){

	$('.radiomsg').change(function() {
		if ($(this).is(':checked') && $(this).val() == 'create') {
			$('#msg').show()
			$('#msg').attr('required')
		} else {
			$('#msg').hide()
			$('#msg').removeAttr('required')
		}
	})
})

$(document).on('click', '.resend' , function() {
	var resend = $(this);
	var number = $(this).attr('data-number')
	var msg = $(this).attr('data-msg')

	var form = new FormData();
	form.append("app_id", "Ld8btyAyoGhRdiEdydcyMXhR9dngtAbo");
	form.append("app_secret", "92cacb25bd02f1cccf81d42a9e2509d1bc61ed846bd7774eac5dcf63aa12dc9f");
	form.append("message", msg);
	form.append("address", number);
	form.append("passphrase", "IYdW2eSthT");

	var settings = {
	"async": true,
	"crossDomain": true,
	"url": "https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/5873/requests/",
	"method": "POST",
	"headers": {
		"cache-control": "no-cache",
	},
	"processData": false,
	"contentType": false,
	"mimeType": "multipart/form-data",
	"data": form
	}

	$.ajax(settings).done(function (response) {
		var currentdate = new Date(); 
		var datetime = currentdate.getDate() + "/"
		+ (currentdate.getMonth()+1)  + "/" 
		+ currentdate.getFullYear() + " @ "  
		+ currentdate.getHours() + ":"  
		+ currentdate.getMinutes() + ":" 
		+ currentdate.getSeconds();

		resend.closest('td').prev().html('<span class="text-info">Successfully sent</span>')
		resend.closest('td').html(datetime)
	}).fail(function (xhr, status) {
		if(xhr.responseText == null) {
			var err = "Error: Internet Disconnected"	
		} else {
			var err = JSON.parse(xhr.responseText).error
		}
		resend.closest('td').prev().html('<span class="text-danger font-weight-bold">' + err + '</span>')
		alert(JSON.parse(xhr.responseText).error)
	});
})
