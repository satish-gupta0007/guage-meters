import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DiameterService } from 'src/app/shared/diameter.service';
import Swal from 'sweetalert2'
import { ToastrService } from 'ngx-toastr';
declare var google: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  PipeForm: FormGroup;
  AllDropDown: any = [];
  TemDiameters: any = [];
  Diameters: any;
  dens: any;
  diameter: any;
  NewVolflow: any;
  lamda: any;
  visc: any;
  MassNewValue: any;
  internalDiameter: any;


  constructor(private fb: FormBuilder,
    private diameterservice: DiameterService,
    private toastr: ToastrService) {

  }

  ngOnInit(): void {
    this.getLocalStorageavalue();
    this.PipeForm = this.fb.group({
      temperature: [''],
      massflow: [''],
      volflow: [''],
      heatload: [''],
      fittings: [''],
      deltaT: ['6'],
      pipe_length: [''],
      vel_limit: [''],
      pa_limit: [''],
      pipe: [''],
      diameter: [''],
      roughness: [''],
      pressure_drop: [''],
      eq_length: [''],
      vel_pressure: [''],
      velocity: [''],
      density: [''],
      reynolds: [''],
      selectdiameter: [''],
    })
    this.getDropdown();
    google.charts.load('current', {
      'packages': ['gauge']
    });
    this.googledraw1();
  }

  getDropdown() {
    this.diameterservice.getData().subscribe((data: any) => {
      this.AllDropDown = data;
    })
  }

  pipeType(data) {
    if (data == "") {
      this.Diameters = null;
      let p = "";
      this.PipeForm.controls['diameter'].setValue(p);
    }
    else {
      let p = "";
      this.PipeForm.controls['diameter'].setValue(p);
      this.Diameters = this.AllDropDown.PipeType.find(con => con.name == data);
      this.TemDiameters = this.Diameters.internaldiameter;
      this.Diameters = this.Diameters.diameter;
    }

  }

  change_volflow(value) {
    let vol_flow = parseFloat(value);
    if (vol_flow > 0) {
      this.get_density(this.PipeForm.controls['temperature'].value);
      if (this.dens == undefined) {
        return
      }
      else {
        let p = vol_flow * this.dens / 1000.0;
        localStorage.setItem("dial4", value.toString());
        this.googledraw1();
        this.PipeForm.controls['massflow'].setValue(p);
      }

    }
  }

  change_heatload(value) {
    let load = parseFloat(this.PipeForm.controls['heatload'].value);
    let deltat = parseFloat(this.PipeForm.controls['deltaT'].value);
    if (load < 0) load = load * -1.0;
    deltat = Math.abs(deltat);
    if (deltat != 0) {
      this.get_density(this.PipeForm.controls['temperature'].value);
      if (this.dens == undefined) {
        return
      }
      else {
        let vlflow = (load / (4.190 * this.dens * deltat)) * 1000.0;
        localStorage.setItem("dial4", vlflow.toString());
        this.googledraw1();
        this.PipeForm.controls['volflow'].setValue(vlflow);
        let msflow = load / (4.190 * deltat);
        this.PipeForm.controls['massflow'].setValue(msflow);
      }


    }

  }


  get_lamda(r, kd) {
    let lamda = 0.11 * Math.pow((kd + 68.0 / r), 0.25);
    let one_over_root_lamda = 1.0 / Math.sqrt(lamda);
    let error = 1;
    while (Math.abs(error) > 0.00001) {
      let new_val = -2.0 * Math.log((2.51 * one_over_root_lamda / r) + (kd / 3.7)) / Math.log(10.0);
      error = one_over_root_lamda - new_val;
      one_over_root_lamda = new_val;
    }

    lamda = 1.0 / (one_over_root_lamda * one_over_root_lamda);

    return (lamda);
  }


  get_diameter(p, q, k, visc, rho) {
    let d = Math.sqrt(4 * q / (Math.PI * rho));
    let error = 1.0;
    let count = 1;

    while (Math.abs(error) > 0.000001 && count < 500) {
      ++count;
      let logterm = 2.51 * visc * Math.sqrt(rho / (2 * d * d * d * p)) + k / (3.7 * d);
      let root_one_over_lamda = - 2.0 * Math.log(logterm) / Math.log(10.0);
      let lamda = 1.0 / (root_one_over_lamda * root_one_over_lamda);
      let new_d5 = 8 * q * q * lamda / (Math.PI * Math.PI * rho * p);
      let new_d = Math.pow(new_d5, 0.2); error = d - new_d; d = d - error / 10;
    } return (d);
  }

  get_density(t) {
    t = parseFloat(t)
    let density = new Array(1000, 999.7, 999.8, 995.6, 992.2, 988, 983.2, 977.8, 971.8, 965.3,
      958.4, 950.6, 943.3, 934.6, 925.9, 916.6, 907.4, 897.7, 886.5, 875.6, 864.3);
    if ((t > 3) && (t < 200)) {
      let x = Math.floor(t / 10);
      let y = t - x * 10;
      this.dens = density[x] + y / 10.0 * (density[x + 1] - density[x]);
    } else {
      Swal.fire('Oops...', 'Temperature should be between 3 and 200', 'error');
      return this.dens
    }

  }

  get_viscosity(t) {
    let viscosity = new Array(1.5510, 1.3004, 1.0022, 0.8005, 0.6561, 0.5506, 0.4709, 0.4091, 0.3612, 0.3222, 0.2911,
      0.2651, 0.2438, 0.2258, 0.2106, 0.1975, 0.1862, 0.1760, 0.1681, 0.1610, 0.1550);
    if ((t > 3) && (t < 200)) {
      let x = Math.floor(t / 10);
      let y = t - x * 10;
      this.visc = viscosity[x] + y / 10.0 * (viscosity[x + 1] - viscosity[x]);
      this.visc = this.visc * 1.0e-6
    }

    else {
      Swal.fire('Oops...', 'Temperature should be between 3 and 200', 'error');
    }

  }

  pressureCalc(data) {
    let massFlow = 0.0;
    if (!(massFlow = parseFloat(data.massflow))) {
      Swal.fire('Oops...', 'You must enter mass flow, volume flow or heat load and delta T', 'error');
      return;
    }
    massFlow = Math.abs(massFlow);
    let temperature = parseFloat(data.temperature);
    if ((temperature < 3) || (temperature > 90)) Swal.fire('Oops...', 'Only accurate for temperatures between 3 and 90degC', 'error');
    let roughness = data.roughness / 1000.0;
    this.get_density(temperature);
    this.get_viscosity(temperature);
    if (this.dens == undefined || this.visc == undefined) {
      return
    }
    else {
      if (data.diameter == "calc") {
        this.diameter = this.get_diameter(250.0, massFlow, roughness, this.visc, this.dens);
      }
      else {
        if (!(this.diameter = parseFloat(data.diameter) / 1000.0)) {
          Swal.fire('Oops...', 'Choose a pipe size or enter the inner diameter', 'error');
          return;
        }
      }

      let vol_flow = massFlow / this.dens;
      let area = Math.PI * this.diameter * this.diameter / 4.0;
      let velocity = vol_flow / area;
      let velocity_pressure = 0.5 * this.dens * velocity * velocity;
      let reynolds = velocity * this.diameter / this.visc;

      if (reynolds < 2000) {
        this.lamda = 64.0 / reynolds;
        this.toastr.success("Laminar flow equation used");
      } else {
        this.lamda = this.get_lamda(reynolds, roughness / this.diameter);
      }

      let pressure = this.lamda / this.diameter * velocity_pressure;
      let eq_length = this.diameter / this.lamda;
      this.PipeForm.patchValue({
        pressure_drop: Math.round(pressure * 10) / 10,
        eq_length: Math.round(eq_length * 100) / 100,
        vel_pressure: Math.round(velocity_pressure * 10) / 10,
        velocity: Math.round(velocity * 100) / 100,
        density: Math.round(this.dens * 10) / 10,
        reynolds: Math.round(reynolds),
        diameter: Math.round(this.diameter * 10000) / 10
      })
      if (massFlow < 0.1) {
        this.PipeForm.patchValue({
          massflow: Math.round(massFlow * 10000) / 10000,
          volflow: Math.round(vol_flow * 10000000) / 10000,
          heatload: Math.round(massFlow * 4.190 * data.deltaT * 1000) / 1000

        })

        localStorage.setItem("dial4", this.PipeForm.controls['volflow'].value.toString());
        this.googledraw1();

      }
      else if (massFlow < 1) {
        this.PipeForm.patchValue({
          massflow: Math.round(massFlow * 1000) / 1000,
          volflow: Math.round(vol_flow * 1000000) / 1000,
          heatload: Math.round(massFlow * 4.190 * data.deltaT * 100) / 100
        })
      }
      else if (massFlow < 10) {
        this.PipeForm.patchValue({
          massflow: Math.round(massFlow * 100) / 100,
          volflow: Math.round(vol_flow * 100000) / 100,
          heatload: Math.round(massFlow * 4.190 * data.deltaT * 10) / 10
        })
        localStorage.setItem("dial4", this.PipeForm.controls['volflow'].value.toString());
        this.googledraw1();

      } else {
        this.PipeForm.patchValue({
          massflow: Math.round(massFlow * 10) / 10,
          volflow: Math.round(vol_flow * 10000) / 10,
          heatload: Math.round(massFlow * 4.190 * data.deltaT)
        })
        localStorage.setItem("dial4", this.PipeForm.controls['volflow'].value.toString());
        this.googledraw1();
      }
    }


  }

  selectedOption(l) {
    if (l > 0) {
      let p = this.TemDiameters[l];
      this.PipeForm.controls['diameter'].setValue(p);
      let q = this.TemDiameters[0]
      this.PipeForm.controls['roughness'].setValue(q);
      this.pressureCalc(this.PipeForm.value);
    }
  }
  googledraw1() {
    google.charts.setOnLoadCallback(this.drawChart);
    google.charts.setOnLoadCallback(this.drawChart1);
    google.charts.setOnLoadCallback(this.drawChart4);
    google.charts.setOnLoadCallback(this.drawChart3);
  }

  drawChart() {
    let p = localStorage.getItem("dial1");
    let data = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['m/s', parseFloat(p)],
    ]);

    let options = {
      width: 400,
      height: 120,
      redFrom: 1.5,
      redTo: 20,
      greenFrom: 0,
      greenTo: 1.5,
      minorTicks: 5,
      majorTicks: 20,
      max: 20
    };

    options.greenTo = parseFloat(p);
    options.redFrom = options.greenTo;

    let chart = new google.visualization.Gauge(document.getElementById('chart_div'));
    chart.draw(data, options);

  }

  drawChart1() {
    let p = localStorage.getItem("dial2");

    let data = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['Pa/m', parseFloat(p)],
    ]);

    let options = {
      width: 400,
      height: 120,
      redFrom: 300,
      redTo: 1000,
      greenFrom: 0,
      greenTo: 300,
      minorTicks: 5,
      max: 1000
    };

    let chart = new google.visualization.Gauge(document.getElementById('chart_div2'));
    options.greenTo = parseFloat(p);
    options.redFrom = options.greenTo;
    chart.draw(data, options);
  }



  drawChart4() {
    let c3 = parseFloat(localStorage.getItem("dial3"));
    let data = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['l/s', c3],

    ]);

    let options = {
      width: 400,
      height: 120,
      majorTicks: 10,
      minorTicks: 5,
      max: 5
    };

    let chart = new google.visualization.Gauge(document.getElementById('chart_div4'));
    chart.draw(data, options);

  }

  //Guage chart4
  drawChart3() {
    let c4 = parseFloat(localStorage.getItem("dial4"))
    let data = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['Pa', c4],

    ]);

    let options = {
      width: 400,
      height: 120,
      minorTicks: 5,
      majorTicks: 60,
      max: 100000
    };

    let chart = new google.visualization.Gauge(document.getElementById('chart_div3'));
    chart.draw(data, options);
  }
  dial3set(value) {
    let l = this.PipeForm.controls['pipe_length'].value;
    let p;
    if (l == "") {
      p = value * 1;
    }
    else {
      p = value * l;
    }

    localStorage.setItem("dial2", value.toString());
    localStorage.setItem("dial3", p.toString());
    this.googledraw1();
  }
  dialone(val) {
    localStorage.setItem("dial1", val);
    this.googledraw1();
  }
  getLocalStorageavalue() {
    localStorage.setItem("dial1", "0");
    localStorage.setItem("dial3", "0");
    localStorage.setItem("dial4", "0");
    localStorage.setItem("dial2", "0");
  }
  temp(value) {
    let l = this.PipeForm.controls['pa_limit'].value;
    let p;
    if (l == "") {
      p = value * 1;
    }
    else {
      p = value * l;
    }
    localStorage.setItem("dial3", p.toString());
    this.googledraw1();
  }
}
