import json
import io
import sys
import os
import contextlib

NOTEBOOK_PATH = "Inzira_Recommender_Model.ipynb"

def run():
    # Change working directory to 'notebook/' to align with relative pathing
    os.chdir("notebook")
    print(f"Loading notebook: {NOTEBOOK_PATH} in directory {os.getcwd()}")
    with open(NOTEBOOK_PATH, 'r', encoding='utf-8') as f:
        nb = json.load(f)

    # Global namespace for execution
    globals_dict = {}
    
    # Set matplotlib backend to Agg and mock show to capture plots
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        plt.show = lambda *args, **kwargs: None
    except Exception as e:
        print(f"Could not mock matplotlib show: {e}")
    
    execution_count = 1
    
    for i, cell in enumerate(nb.get("cells", [])):
        if cell.get("cell_type") == "code":
            source_lines = cell.get("source", [])
            source_code = "".join(source_lines)
            
            print(f"\n--- Running Cell {execution_count} ---")
            print(source_code[:100] + "..." if len(source_code) > 100 else source_code)
            
            # Setup output capture
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            cell_outputs = []
            
            with contextlib.redirect_stdout(stdout_capture), contextlib.redirect_stderr(stderr_capture):
                try:
                    # Execute code cell in shared globals
                    exec(source_code, globals_dict)
                    error = None
                except Exception as e:
                    error = e
                    print(f"Error in cell execution: {e}", file=sys.stderr)
            
            # Capture and embed any matplotlib figures generated in this cell
            try:
                import matplotlib.pyplot as plt
                import base64
                fig_ids = plt.get_fignums()
                if fig_ids:
                    for fig_id in fig_ids:
                        fig = plt.figure(fig_id)
                        buf = io.BytesIO()
                        fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
                        buf.seek(0)
                        img_b64 = base64.b64encode(buf.read()).decode('utf-8')
                        cell_outputs.append({
                            "data": {
                                "image/png": img_b64,
                                "text/plain": f"<Figure size {fig.get_size_inches()[0]*fig.dpi}x{fig.get_size_inches()[1]*fig.dpi} with {len(fig.axes)} Axes>"
                            },
                            "metadata": {},
                            "output_type": "display_data"
                        })
                        print(f"[PLOT EMBEDDED]: Successfully embedded matplotlib figure {fig_id} inside the notebook cell outputs.")
                    plt.close('all')
            except Exception as plot_err:
                print(f"Failed to capture figure: {plot_err}")
            
            # Read captured outputs
            stdout_text = stdout_capture.getvalue()
            stderr_text = stderr_capture.getvalue()
            
            # Append stdout stream output if present
            if stdout_text:
                cell_outputs.append({
                    "name": "stdout",
                    "output_type": "stream",
                    "text": stdout_text.splitlines(keepends=True)
                })
                print("[STDOUT]:", stdout_text.strip())
                
            # Append stderr stream output if present
            if stderr_text:
                cell_outputs.append({
                    "name": "stderr",
                    "output_type": "stream",
                    "text": stderr_text.splitlines(keepends=True)
                })
                print("[STDERR]:", stderr_text.strip())
                
            # If there was an exception, create an error output
            if error:
                import traceback
                tb_lines = traceback.format_exception(type(error), error, error.__traceback__)
                cell_outputs.append({
                    "ename": type(error).__name__,
                    "evalue": str(error),
                    "output_type": "error",
                    "traceback": tb_lines
                })
                
            # Update cell metadata
            cell["outputs"] = cell_outputs
            cell["execution_count"] = execution_count
            
            execution_count += 1

    # Save the executed notebook back
    with open(NOTEBOOK_PATH, 'w', encoding='utf-8') as f:
        json.dump(nb, f, ensure_ascii=False, indent=1)
        
    print(f"\nSuccessfully executed and saved notebook to {NOTEBOOK_PATH}")

if __name__ == "__main__":
    run()
