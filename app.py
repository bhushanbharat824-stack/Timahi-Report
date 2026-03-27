import os
import json
import uuid
import datetime
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict, field
from nicegui import ui, app
import google.generativeai as genai
import pandas as pd

# --- Configuration & Models ---

@dataclass
class Report:
    id: str
    year: str
    quarter: str
    region: str
    section_name: str
    submitted_by: str
    correspondence_hindi: int
    correspondence_total: int
    overall_percentage: float
    s33_total: int
    s33_bilingual: int
    noting_hindi: int
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    ack_id: str = field(default_factory=lambda: f"RAJ-{str(uuid.uuid4())[:6].upper()}")

# --- Services ---

class DataService:
    FILE_PATH = "reports.json"
    
    @staticmethod
    def get_reports() -> List[Dict]:
        if not os.path.exists(DataService.FILE_PATH):
            return []
        try:
            with open(DataService.FILE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []

    @staticmethod
    def save_report(report: Report):
        reports = DataService.get_reports()
        reports.append(asdict(report))
        with open(DataService.FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(reports, f, indent=2, ensure_ascii=False)

class AIService:
    @staticmethod
    def analyze_trends(reports_data: List[Dict]):
        if not reports_data:
            return "विश्लेषण के लिए कोई डेटा उपलब्ध नहीं है।"
        
        api_key = os.getenv("API_KEY")
        if not api_key:
            return "त्रुटि: API_KEY कॉन्फ़िगर नहीं है।"
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        summary = "\n".join([f"Q: {r['quarter']}, Hindi: {r['overall_percentage']}%" for r in reports_data])
        prompt = f"Analyze these Rajbhasha trends and provide a professional executive summary in Hindi: {summary}"
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI त्रुटि: {str(e)}"

# --- UI Components ---

class RajbhashaApp:
    def __init__(self):
        self.current_user = None
        self.view = "login"
        self.reports = DataService.get_reports()
        self.sections = ["स्थापना (Est)", "लेखा (Accounts)", "प्रशासन (Admin)", "तकनीकी (Tech)", "सतर्कता (Vigilance)"]
        
    def render(self):
        ui.colors(primary='#312e81', secondary='#f59e0b')
        ui.add_head_html('<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" rel="stylesheet">')
        ui.query('body').style('font-family: "Noto Sans Devanagari", sans-serif;')

        @ui.refreshable
        def content():
            if self.view == "login":
                self.login_view()
            else:
                self.main_layout()

        content()

    def login_view(self):
        with ui.element('div').classes('min-h-screen bg-indigo-950 flex items-center justify-center p-4'):
            with ui.card().classes('w-full max-w-md p-8 rounded-[40px] bg-white/10 backdrop-blur-xl border border-white/20 text-center shadow-2xl'):
                ui.icon('languages', size='4rem').classes('text-white mb-4')
                ui.label('राजभाषा पोर्टल').classes('text-3xl font-black text-white mb-2')
                ui.label('तिमाही रिपोर्ट प्रबंधन प्रणाली').classes('text-indigo-200/60 mb-8')
                
                with ui.column().classes('w-full gap-4'):
                    for section in self.sections:
                        ui.button(section, on_click=lambda s=section: self.login(s)).classes('w-full bg-white text-indigo-900 font-bold py-4 rounded-2xl hover:bg-indigo-50 transition')

    def login(self, section: str):
        self.current_user = {"name": section, "role": "SECTION"}
        self.view = "dashboard"
        ui.notify(f"स्वागत है, {section}")
        ui.navigate.to('/')

    def main_layout(self):
        with ui.header().classes('bg-indigo-900 text-white shadow-xl'):
            with ui.row().classes('max-w-7xl mx-auto w-full items-center justify-between p-4'):
                ui.label('राजभाषा पोर्टल').classes('text-xl font-bold cursor-pointer').on('click', lambda: self.set_view('dashboard'))
                with ui.row().classes('gap-4'):
                    ui.button('डैशबोर्ड', on_click=lambda: self.set_view('dashboard')).props('flat color=white')
                    ui.button('नई रिपोर्ट', on_click=lambda: self.set_view('new-report')).props('flat color=white')
                    ui.button('रिपोर्ट सूची', on_click=lambda: self.set_view('list')).props('flat color=white')
                    ui.button('लॉगआउट', on_click=self.logout).props('flat color=red-400')

        with ui.column().classes('max-w-7xl mx-auto w-full p-8'):
            if self.view == "dashboard":
                self.dashboard_view()
            elif self.view == "new-report":
                self.report_form_view()
            elif self.view == "list":
                self.list_view()

    def set_view(self, view_name: str):
        self.view = view_name
        ui.navigate.to('/')

    def logout(self):
        self.current_user = None
        self.view = "login"
        ui.navigate.to('/')

    def dashboard_view(self):
        ui.label(f'डैशबोर्ड: {self.current_user["name"]}').classes('text-3xl font-bold text-gray-800 mb-6')
        with ui.row().classes('w-full grid grid-cols-1 md:grid-cols-3 gap-6'):
            with ui.card().classes('p-6 bg-white rounded-3xl border border-gray-100 shadow-sm'):
                ui.label('कुल रिपोर्ट').classes('text-sm text-gray-500 font-bold')
                ui.label(str(len(self.reports))).classes('text-4xl font-black text-indigo-600')
            with ui.card().classes('p-6 bg-white rounded-3xl border border-gray-100 shadow-sm'):
                ui.label('औसत हिंदी %').classes('text-sm text-gray-500 font-bold')
                avg = sum(r['overall_percentage'] for r in self.reports)/len(self.reports) if self.reports else 0
                ui.label(f"{avg:.2f}%").classes('text-4xl font-black text-green-600')
            with ui.card().classes('p-6 bg-indigo-50 rounded-3xl border border-indigo-100 shadow-sm'):
                ui.label('पावती (Latest)').classes('text-sm text-indigo-400 font-bold')
                latest_ack = self.reports[-1]['ack_id'] if self.reports else "---"
                ui.label(latest_ack).classes('text-2xl font-black text-indigo-900')

    def report_form_view(self):
        ui.label('नई रिपोर्ट जमा करें').classes('text-2xl font-bold mb-6')
        with ui.card().classes('w-full max-w-2xl p-8 rounded-3xl shadow-lg border border-gray-100'):
            with ui.column().classes('w-full gap-4'):
                year = ui.select(['2024', '2025'], label='वर्ष').classes('w-full')
                quarter = ui.select(['Q1', 'Q2', 'Q3', 'Q4'], label='तिमाही').classes('w-full')
                
                ui.separator().classes('my-4')
                ui.label('पत्राचार विवरण').classes('font-bold text-indigo-700 text-lg')
                
                with ui.row().classes('w-full gap-4'):
                    h_count = ui.number('हिंदी पत्र', value=0).classes('flex-1')
                    t_count = ui.number('कुल पत्र', value=0).classes('flex-1')
                
                ui.label('धारा 3(3) अनुपालन').classes('font-bold text-indigo-700 mt-4')
                with ui.row().classes('w-full gap-4'):
                    s33_total = ui.number('कुल दस्तावेज', value=0).classes('flex-1')
                    s33_bi = ui.number('द्विभाषी', value=0).classes('flex-1')

                def save():
                    if t_count.value < h_count.value:
                        ui.notify("त्रुटि: कुल पत्र हिंदी पत्रों से कम नहीं हो सकते।", type='negative')
                        return
                    
                    perc = (h_count.value / t_count.value * 100) if t_count.value > 0 else 0
                    new_report = Report(
                        id=str(uuid.uuid4()),
                        year=year.value,
                        quarter=quarter.value,
                        region="A",
                        section_name=self.current_user['name'],
                        submitted_by=self.current_user['name'],
                        correspondence_hindi=int(h_count.value),
                        correspondence_total=int(t_count.value),
                        overall_percentage=round(perc, 2),
                        s33_total=int(s33_total.value),
                        s33_bilingual=int(s33_bi.value),
                        noting_hindi=0
                    )
                    DataService.save_report(new_report)
                    self.reports = DataService.get_reports()
                    ui.notify("रिपोर्ट सफलतापूर्वक सहेजी गई!", type='positive')
                    self.set_view('list')

                ui.button('जमा करें (Submit)', on_click=save).classes('w-full mt-6 py-4 bg-indigo-700 text-white rounded-2xl font-bold text-lg hover:bg-indigo-800 shadow-xl')

    def list_view(self):
        ui.label('रिपोर्ट सूची').classes('text-2xl font-bold mb-6')
        
        # Mapping data to table rows
        rows = []
        for r in self.reports:
            rows.append({
                'year': r['year'],
                'quarter': r['quarter'],
                'section': r['section_name'],
                'perc': f"{r['overall_percentage']}%",
                's33': f"{r['s33_bilingual']}/{r['s33_total']}",
                'ack': r['ack_id']
            })

        columns = [
            {'name': 'year', 'label': 'वर्ष', 'field': 'year', 'sortable': True},
            {'name': 'quarter', 'label': 'तिमाही', 'field': 'quarter'},
            {'name': 'section', 'label': 'अनुभाग', 'field': 'section', 'sortable': True},
            {'name': 'perc', 'label': 'हिंदी %', 'field': 'perc'},
            {'name': 's33', 'label': 'धारा 3(3)', 'field': 's33'},
            {'name': 'ack', 'label': 'पावती', 'field': 'ack'},
        ]
        
        with ui.card().classes('w-full p-0 rounded-3xl overflow-hidden border border-gray-100'):
            ui.table(columns=columns, rows=rows, row_key='ack').classes('w-full')

app_instance = RajbhashaApp()

@ui.page('/')
def index():
    app_instance.render()

if __name__ in {"__main__", "nicegui"}:
    # Changed port to 8081 (Port 8000 is often blocked by AirPlay on Mac)
    ui.run(title="राजभाषा प्रबंधन", port=8081, reload=True, show=True)
