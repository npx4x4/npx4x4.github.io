import flet as ft
from z3 import *

# ここに変数置いてはいけない

def main(page: ft.Page):
    page.title = "噂ランキング"
    page.theme_mode = ft.ThemeMode.LIGHT
    # page.theme  =   ft.Theme(

    #                 )
    
    ## データ変数
    ranking_size: int = 40;
    members = []
    
    
    
    # ヘッダー部分
    url_launcher = ft.UrlLauncher()
    async def go_home(e: ft.Event[ft.Button]):
        #"_self" <- タブ遷移せずurlを開く
        await url_launcher.launch_url("https://npx4x4-tools.vercel.app/", web_only_window_name="_self",)
    
    home_button = ft.Button(content="ホームに戻る", on_click=go_home,)
    title = ft.Text("噂ランキング", theme_style=ft.TextThemeStyle.DISPLAY_LARGE)

    
    ## ランキング
    # 対象人数を取得
    num_members =   ft.TextField(
                        width=100,
                        label="参加人数",
                        value=40,
                        input_filter=ft.InputFilter(
                            allow=True,
                            regex_string=r"^[0-9]*$",
                            replacement_string=""
                        )
                    )
    
    # 並び替え条件(uwasa)を取得
    # 誰がorは(uwasaの主語)
    who_input = ft.AutoComplete(
                    width=160,
                    on_change=None,
                    on_select=None,
                    suggestions=[
                        ft.AutoCompleteSuggestion(key=key, value=value)
                        for key, value in members
                    ],
                )
    
    # 比較対象(人)
    target_mem_input =  ft.Dropdown(
                            width=160,
                            editable=True,
                            label="比較対象",
                            options=[
                                ft.DropdownOption(key=member, leading_icon=member)
                                for member in members
                            ]
                        )
    
    # 比較対象(順位)
    def value_check(e: ft.Event[ft.TextField]):
        pass
    target_num_input =  ft.TextField(
                            width=160,
                            label="順位",
                            input_filter=ft.InputFilter(
                                allow=True,
                                regex_string=r"^[0-9]*$",
                                replacement_string="",
                            ),
                            on_change=value_check,
                        )
    
    # 比較対象タイプの切り替え
    def update_target_type(e):
        radio_value = target_type_radio.value
        if radio_value=="mem":
            target_mem_input.visible = True
            target_num_input.visible = False
        else:
            target_mem_input.visible = False
            target_num_input.visible = True
        
        page.update()
    
    
    # 比較しての評価
    op_input =  ft.Dropdown(
                    width=160,
                    label="比較",
                    value=None,
                    options=[
                        ft.DropdownOption(key=">", text="より高い"),
                        ft.DropdownOption(key="=", text="と同じ"),
                        ft.DropdownOption(key="<", text="より低い"),
                    ],
                )
    

    # uwasaの各入力を取得しSMTソルバ用に処理を行う
    def add_uwasa(e: ft.Event[ft.Button]):
        #噂の各種要素を取得
        who = op_input.value
        target = target.value
        op = op_input.value
        


    # SMTソルバ処理
    def ranking():
        s = Solver()
        
        # if result == sat:
    
    # ランキング用テーブル
        ranking_view =  ft.DataTable(
                            width=800,
                            border=ft.border.all(2, "#1c8c42"),
                            columns=[
                                ft.DataColumn(
                                    ft.Text("名前"),
                                ),
                                ft.DataColumn(
                                    ft.Text("状態"),
                                ),
                            ],
                            rows=[
                                ft.DataRow(
                                    [ft.DataCell(ft.Text)]
                                )
                            ]
                        )
                            
    
    # 表示
    page.add(
        ft.Container(
            content=home_button,
            padding=ft.padding.only(left=5, top=15,),
        ),
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            controls=[
                title,
            ]
        ),
        ft.Container(
            content=ft.Row(
                        alignment=ft.MainAxisAlignment.CENTER,
                        controls=[
                            num_members,
                            ft.TextButton(
                                content="更新", 
                                icon=ft.Icons.LOOP, 
                                tooltip="設定を変更すると入力した情報がリセットされます."
                            ),
                        ]
                    ),
            padding=ft.padding.only(top=20, bottom=30),
        ),
        ft.Column(
            alignment=ft.MainAxisAlignment.START,
            controls=[
                ft.Row(
                    alignment=ft.MainAxisAlignment.CENTER,
                    controls=[
                        who_input,
                        ft.Text("は", size=16),
                        target_mem_input,
                        target_num_input,
                        op_input,
                    ]
                ),
                ft.Row(
                    alignment=ft.MainAxisAlignment.CENTER,
                    controls=[
                        target_type_radio := ft.RadioGroup(
                            content=ft.Row(
                                controls=[
                                    ft.Radio(value="mem", label="人"),
                                    ft.Radio(value="num", label="順位"),
                                ],
                            ),
                            on_change=update_target_type,
                        ), 
                        ft.Button(width=160, content="噂をながす", on_click=ranking),
                    ]
                )
            ]
        ),
    )
    
    # 初期設定
    target_mem_input.visible = True
    target_num_input.visible = False
    target_type_radio.value = "mem"

ft.run(main)