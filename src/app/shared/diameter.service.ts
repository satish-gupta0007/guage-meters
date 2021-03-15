import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DiameterService {
  url = "./assets/db.json"
  constructor(private http: HttpClient) { }

  getData() {
    return this.http.get(this.url)
  }
}
