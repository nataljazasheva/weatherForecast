var api_url = 'http://api.openweathermap.org/data/2.5/forecast/daily?', 	
    api_url_params = '&cnt=7&units=metric&APPID=f435fbac1eb4aff340dca94ac1b75804';

$(function() {
	
	var weatherIcons = getWeatherIcons();
	activateCarousel();
	getDisplayWeather(); 
	
	$("#temp_units").on("change", function() {
		var units = this.checked? "imperial" : "metric"; 
		setUnitSystem(units);
        renderFromCache();
    });

	$("#get_local_weather").on('click', function() {
		getCurrentWeather_local();
		sessionStorage.setItem("weather_city", '');
		$(".search_container").addClass("hidden"); 
		$("header, article").removeClass("hidden"); 
		
	}); 

	$("#choose_city").on('click', function() {
		$(".search_container").removeClass("hidden"); 
		$("header, article").addClass("hidden"); 
		$("#city").val("").focus(); 
	});

  	$(".search_form").on('submit', function(event) {
  		event.preventDefault();
		var city = $("#city").val(); 
		var last_city = sessionStorage.getItem("weather_city");
		
		if (city === last_city) {
			console.log("City: FROM CACHE");
			renderFromCache(); 
		} 
		else {
			console.log("City: REMOTE");
			sessionStorage.setItem("weather_city", city);
			var api_url_7days_city = api_url + 'q=' + city + api_url_params;

	        getRemoteWeatherData(api_url_7days_city);
		}
		
    	$(".search_container").addClass("hidden");
    	$("header").removeClass("hidden"); 
  		$("article").removeClass("hidden");

	});

}); 


function getDisplayWeather() {
	var city = sessionStorage.getItem("weather_city"); 
	
	var now = Math.round(Date.now() / 1000);

    if (sessionStorage.getItem("timestamp") && sessionStorage.getItem("timestamp") >= now - 1800) {
    	console.log("Timestamp, get data FROM CACHE");
        renderFromCache();
    } 
    else {
    	console.log("No timestamp, read data REMOTE");
        getCurrentWeather_local();
    }
}

function getCurrentWeather_local() {
	if (navigator.geolocation) {
    	navigator.geolocation.getCurrentPosition(gotLocation);

      	function gotLocation(position) {
	        lat = position.coords.latitude;
	        lon = position.coords.longitude;
	        var api_url_7days_coords = api_url + 'lat='	+ lat + '&lon=' + lon + api_url_params;  
	        
	        getRemoteWeatherData(api_url_7days_coords);
    	}					
  	} 
	else {
	    $('#error').text('Your browser doesnt support geolocation.');
	}
}; 

function localizeTemperature(metric) {
    metric = Math.round(metric);
    if (getUnitSystem() == "imperial") {
        return (metric * 9 / 5 + 32).toFixed() + "&deg;F";
    } else {
        return metric.toFixed() + "&deg;C";
    }
}; 

function getRemoteWeatherData(api_url) {
	$.ajax({
		url : api_url,
		type : "GET",
		cache: false, 
		dataType: "jsonp"
	})	
	.done( function(data) {
		sessionStorage.setItem("cache_weather", JSON.stringify(data));
		sessionStorage.setItem("timestamp", Math.round(Date.now() / 1000)); 
		sessionStorage.setItem("weather_city", data.city.name); 
	    renderFromCache();
	})
	.fail( function(errorData) {
	  	$("#error").html("Error retrieving weather or forecast: " + errorData.status);
	});
}; 

function getWeatherIcons() {
	$.getJSON('/icons.json')
	.done(function (data) {
	    weatherIcons = data; 
	    sessionStorage.setItem("weather_icons", JSON.stringify(data));
  	})
  	.fail(function(errorData) {
	  	$("#error").html("Error retrieving weather icons: " + errorData.status);
	});
}; 

function getDate(d) {

	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

	var months =   ["January", "February", "March", 
					"April", "May", "June", "July", "August", "September", 
					"October", "November", "December"];

	var curr_day = d.getDay();
	var curr_date = d.getDate();
	var sup = "";
	if (curr_date == 1 || curr_date == 21 || curr_date ==31) {
	   sup = "st";
	}
	else if (curr_date == 2 || curr_date == 22) {
	   sup = "nd";
	}
	else if (curr_date == 3 || curr_date == 23) {
	   sup = "rd";
	}
	else {
	   sup = "th";
	}

	var curr_month = d.getMonth(),
		curr_year = d.getFullYear(),
		formatted_date = days[curr_day] + ", " + months[curr_month] + " " + curr_date + sup  + " " + curr_year;

	return formatted_date;
};

function getWeekDay(date_now, i) {
	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], 
		week_day = (date_now.getDay() + i < 7)? date_now.getDay() + i : date_now.getDay() + i - 7; 
	
	return days[week_day];
};

function renderFromCache() { 
	var date_now = new Date(),
		day_temp, 
		morning_temp, 
		evening_temp,
		night_temp,
		code, 
		icon, 
		description; 

	var data = sessionStorage.getItem("cache_weather"),
		weather_icons = sessionStorage.getItem("weather_icons"); 

	try {
		data = JSON.parse(data);
		weatherIcons = JSON.parse(weather_icons); 
         
    } catch (exception) {
        if (window.console) {
            console.error(exception);
        }
        return;
    }
    
	$('#dateNow').html(getDate(new Date()));
	$('#location').html(data.city.name);
		
	$.each(data.list, function(i,day_weather) {    
		day_temp = localizeTemperature(day_weather.temp.day);			
		code = day_weather.weather[0].id, 
		icon = weatherIcons[code].icon;
		if (!(code > 699 && code < 800) && !(code > 899 && code < 1000)) {
			if (i == 0) {
				var is_day = day_weather.weather[0].icon.indexOf("d") > -1; 
				icon_today = is_day? 'day-' + icon : 'night-' + (icon != 'sunny' ? icon : 'clear');
			}
			icon = 'day-' + icon;
		}
		icon_src = "<i class='wi wi-" + icon + "'></i>";
		icon_src_today = "<i class='wi wi-" + icon_today + "'></i>";
		
		if (i == 0) { // today's weather
			var morning_temp = localizeTemperature(day_weather.temp.morn), 
				evening_temp = localizeTemperature(day_weather.temp.eve),
				night_temp = localizeTemperature(day_weather.temp.night),
				description = day_weather.weather[0].description;
				description = description.substr(0,1).toUpperCase() + description.substr(1); 

			$('#today_weather_desc').html(description);
			$('#today_temp').html(day_temp);
			$('#today_icon').html(icon_src_today);
			$('#morning_temp').html(morning_temp);
			$('#day_temp').html(day_temp);
			$('#evening_temp').html(evening_temp);
			$('#night_temp').html(night_temp);
		}

		// 7 days weather
		$('#day_' + i + ' .temp').html(day_temp); 		
		$('#day_' + i + ' .day').html(getWeekDay(date_now, i)); 	
		$('#day_' + i + ' .weather_icon').html(icon_src); 
	});
}; 

function activateCarousel() {	
	$('.main-carousel').flickity({
		cellAlign: 'left',
		contain: true,  
		watchCSS: true
	});
}; 

function getUnitSystem() {
	var units = sessionStorage.getItem("unit_system");
    if (units != "metric" && units != "imperial") {
        //units = window.navigator.language == "en-US" ? "imperial" : "metric";
        units = "metric"; 
    }
    $('#temp_units').prop('checked', (units == "imperial") ? true : false);
    setUnitSystem(units);
    return units; 
}; 

function setUnitSystem(units) {
	sessionStorage.setItem("unit_system", units);
}	