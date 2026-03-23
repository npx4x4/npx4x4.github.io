import flet as ft
from z3 import *
import dataclasses

menbers = [
    
]


def main(page: ft.Page):
    page.title = "噂ランキング"
    page.bgcolor = ft.Colors.WHITE
    
    # ヘッダー部分
    url_launcher = ft.UrlLauncher()
    async def go_home(e: ft.Event[ft.Button]):
        #"_self" <- タブ遷移せずurlを開く
        await url_launcher.launch_url("https://npx4x4-tools.vercel.app/", web_only_window_name="_self",)
    
    home_button = ft.Button(content="ホームに戻る", on_click=go_home,)
    title = ft.Text("噂ランキング", theme_style=ft.TextThemeStyle.DISPLAY_LARGE)

    ## ランキング
    #対象人数を取得
    num_members =   ft.CupertinoTextField(
                        placeholder_text="人数", 
                        input_filter=ft.InputFilter(allow=True, regex_string=r"^[0-9]*$", replacement_string="")
                    )
    
    #並び替え条件(uwasa)を取得
    #誰がorは(uwasaの主語)
    who_input = ft.AutoComplete(
                    value=None,
                    width=200,
                    on_change=None,
                    on_select=None,
                    suggestions=[
                        ft.AutoCompleteSuggestion(key=key, value=value)
                        for key, value in menbers
                    ],
                )
    
    # op_input

    # target_input = 
    

    # SMTソルバ処理
    def ranking():
        s = Solver()
        
        if result == sat:
        pass

    
    # 表示
    page.add(
        ft.Row(
            home_button,
            title,
        ),
        num_members,
        ft.Row(
            alignment=ft.MainAxisAlignment.CENTER,
            control=[
                who_input,
            ],
        ),
    )

ft.run(main)