/// <reference types="google.maps" />
import { Component, ElementRef, OnInit, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import axios from 'axios';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  animations: [
    trigger('slideTransition', [
      state('results', style({ transform: 'translateX(0)' })),
      state('details', style({ transform: 'translateX(-100%)' })),
      transition('results <=> details', animate('300ms ease-in-out')),
    ]),
  ],
})
export class SearchComponent implements OnInit {

  states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];
  searchForm: FormGroup;
  userLocationObtained = false;
  resultsVisible = false;
  activeTab = 'results';
  weatherData: any = null;
  forecastData: any = null;
  errorMessage = '';
  isLoading = false;
  title = ''; 
  innerTab = 'day-view';
  Highcharts: any;
  detailsVisible = false;
  isFavorited = false; 
  currentDayData: any = {};

  @ViewChild('cityInput', { static: true }) cityField!: ElementRef;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
  private cdr: ChangeDetectorRef
  ) {
    this.searchForm = new FormGroup({
      street: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      state: new FormControl('', Validators.required),
      currentLocation: new FormControl(false)
    });
  }

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const HighchartsModule = await import('highcharts');
      this.Highcharts = HighchartsModule;
      
      const HighchartsMore = await import('highcharts/highcharts-more');
      HighchartsMore.default(this.Highcharts);
    }
  }

  async submitForm() {
    this.clearErrorMessages();
    
    if (this.searchForm.invalid && !this.searchForm.get('currentLocation')?.value) {
      this.errorMessage = "Please fill out all required fields.";
      return;
    }

    if (this.searchForm.get('currentLocation')?.value) {
      await this.autoDetectLocation();
    } else {
      const { street, city, state } = this.searchForm.value;
      await this.fetchGeocodeData(street, city, state);
    }
  }
  
  async autoDetectLocation() {
    try {
      const response = await fetch("https://ipinfo.io?token=eae423885309be");
      const data = await response.json();
      const [lat, lng] = data.loc.split(',');
  
      if (lat && lng) {
        await this.fetchWeatherData(parseFloat(lat), parseFloat(lng), 'Current Location', '');
      } else {
        this.errorMessage = "Error detecting location.";
      }
    } catch (error) {
      this.errorMessage = "Error detecting location.";
    }
  }
  
  async fetchGeocodeData(street: string, city: string, state: string) {
    try {
      const address = `${street}, ${city}, ${state}`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyAXAJfjgD0TctwXCPdGKcLgWwaMb5Uw_1M`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
  
      if (geocodeData.status === 'OK') {
        const location = geocodeData.results[0].geometry.location;
        if (location.lat != null && location.lng != null) {
          await this.fetchWeatherData(location.lat, location.lng, city, state);
        } else {
          this.errorMessage = "Error fetching geocoding data.";
        }
      } else {
        this.errorMessage = "Invalid address. Please enter a valid location.";
      }
    } catch (error) {
      this.errorMessage = "Error fetching geocoding data.";
    }
  }
  
  async fetchWeatherData(lat: number, lng: number, city: string, state: string) {
    if (lat == null || lng == null) {
      this.errorMessage = "Location parameters missing.";
      return;
    }
  
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/weather`, {
        params: { lat, lng },
      });
  
      const weatherData = response.data;
      if (weatherData) {
        this.weatherData = weatherData.realtime;
        console.log(weatherData.forecast); 

        // Set the title with city and state information
        this.title = `Forecast at ${city}, ${state}`;

        this.forecastData = weatherData.forecast.timelines?.daily.map((day: any) => ({
          date: day.time,
          status: day.values.weatherCodeMax === 1000 ? 'Clear' : 'Cloudy',
          tempHigh: day.values.temperatureMax,
          tempLow: day.values.temperatureMin,
          windSpeed: day.values.windSpeedAvg,
        }));

        this.cdr.detectChanges();

        if (this.innerTab === 'daily-temp-chart') {
          setTimeout(() => this.createTemperatureChart(this.forecastData), 0); 
        }
      } else {
        this.forecastData = [];
        this.errorMessage = "Forecast data unavailable"; 
      }
    } catch (error) {
      this.errorMessage = "Error fetching weather data.";
    } finally {
      this.isLoading = false;
    }
  }

  createTemperatureChart(forecastData: any) {
    if (!this.Highcharts) return;

    const temperatureData = forecastData.slice(0, 6).map((day: any) => {
      const date = new Date(day.date).getTime();
      return [date, day.tempLow, day.tempHigh];
    });

    const container = document.getElementById('chart-container');
    if (container) {
      this.Highcharts.chart(container as Highcharts.HTMLDOMElement, <Highcharts.Options>{
        chart: {
          type: 'arearange',
          zooming: { type: 'x' },
          scrollablePlotArea: { minWidth: 600, scrollPositionX: 1 }
        },
        title: { text: 'Temperature Ranges (Min, Max)' },
        xAxis: { 
          type: 'datetime', 
          accessibility: { rangeDescription: 'Next 5 days' },
          crosshair: true
        },
        yAxis: { 
          title: { text: 'Temperature (°F)' },
          crosshair: true
        },
        tooltip: {
          shared: true,
          valueSuffix: '°F',
          xDateFormat: '%A, %b %e'
        },
        legend: { enabled: false },
        series: [{
          name: 'Temperatures',
          type: 'arearange',
          data: temperatureData,
          color: {
            linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
            stops: [[0, '#FFA500'], [1, '#ADD8E6']]
          }
        }]
      });
    } else {
      console.error("Chart container not found");
    }
  }
    
  isFieldInvalid(field: string): boolean {
    const control = this.searchForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  clearForm() {
    this.searchForm.reset();
    this.weatherData = null;
    this.forecastData = null;
    this.errorMessage = '';
    this.resultsVisible = false;
    this.activeTab = 'results';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  setInnerTab(tab: string) {
    this.innerTab = tab;
    if (this.innerTab === 'daily-temp-chart' && this.forecastData) {
      setTimeout(() => this.createTemperatureChart(this.forecastData), 0); 
    }
  }

  clearErrorMessages() {
    this.errorMessage = '';
  }

  toggleFavorite() {
    this.isFavorited = !this.isFavorited;
  }

  toggleDetails() {
    this.detailsVisible = !this.detailsVisible;
    console.log("Details", this.detailsVisible); 
    if (this.detailsVisible && this.weatherData) {
      const dailyData = this.weatherData.forecast.timelines?.daily[0];
      console.log(this.weatherData.forecast.timelines?.daily);
      if (dailyData) {
        this.currentDayData = {
          status: dailyData.values.weatherCodeMax === 1000 ? 'Clear' : 'Cloudy',
          tempHigh: dailyData.values.temperatureMax,
          tempLow: dailyData.values.temperatureMin,
          apparentTempAvg: dailyData.values.temperatureApparentAvg,
          sunriseTime: dailyData.values.sunriseTime,
          sunsetTime: dailyData.values.sunsetTime,
          humidityAvg: dailyData.values.humidityAvg,
          windSpeedAvg: dailyData.values.windSpeedAvg,
          visibilityAvg: dailyData.values.visibilityAvg,
          cloudCoverAvg: dailyData.values.cloudCoverAvg,
          uvIndexMax: dailyData.values.uvIndexMax,
          dewPointAvg: dailyData.values.dewPointAvg,
          pressureSurfaceLevelAvg: dailyData.values.pressureSurfaceLevelAvg
        };

        console.log(this.currentDayData.status); 
      }
    }
  }
  
}
