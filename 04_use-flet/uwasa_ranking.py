import flet as ft
from z3 import *
import dataclasses

ranking_size: int = 0

menbers = [
    
]


def main(page: ft.Page):
    page.title = "噂ランキング"
    page.theme_mode = ft.ThemeMode.LIGHT
    # page.theme  =   ft.Theme(

    #                 )
    
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
                        input_filter=ft.InputFilter(allow=True, regex_string=r"^[0-9]*$", replacement_string="")
                    )
    
    # 並び替え条件(uwasa)を取得
    # 誰がorは(uwasaの主語)
    who_input = ft.AutoComplete(
                    width=160,
                    on_change=None,
                    on_select=None,
                    suggestions=[
                        ft.AutoCompleteSuggestion(key=key, value=value)
                        for key, value in menbers
                    ],
                )
    
    # 比較対象(人)
    target_input =  ft.AutoComplete(
                        width=160,
                        on_change=None,
                        on_select=None,
                        suggestions=[
                            ft.AutoCompleteSuggestion(key=key, value=value)
                            for key, value in menbers
                        ]
                    )
    
    # 比較対象タイプの切り替え
    def update_target_type(e: ft.Event[ft.Radio]):
        if()
    
    
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
        pass

    
    # 表示
    page.add(
        ft.Container(
            content=home_button,
            padding=ft.padding.only(left=5, top=10,),
        ),
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            controls=[
                title,
            ]
        ),
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            controls=[
                num_members,
                ft.IconButton(icon=ft.Icons.LOOP)
            ]
        ),
        ft.Column(
            alignment=ft.MainAxisAlignment.START,
            controls=[
                ft.Row(
                    alignment=ft.MainAxisAlignment.CENTER,
                    controls=[
                        who_input,
                        ft.Text("は", size=16),
                        target_input,
                        op_input,
                    ]
                ),
                ft.Row(
                    alignment=ft.MainAxisAlignment.END,
                    controls=[
                        ft.RadioGroup(
                            content=ft.Row(
                                controls=[
                                    ft.Radio(value="mem", label="人"),
                                    ft.Radio(value="num", label="順位")
                                ],
                            ),
                            on_change=update_target_type,
                        ),
                        ft.Button(content="噂をながす", on_click=ranking),
                    ]
                )
            ]
        ),
    )

ft.run(main)